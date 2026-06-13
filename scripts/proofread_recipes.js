import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const BATCH_SIZE = 10;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function proofreadText(text) {
  if (!text || text.trim() === '') return text;
  
  const prompt = `
You are an expert culinary editor. Proofread the following recipe text.
Fix any spelling mistakes, typos, grammatical errors, and punctuation issues.
Do NOT change the meaning or rewrite it completely. Keep the same format.
Only return the corrected text, with no extra conversational text or markdown formatting (unless it was already there).

Text to proofread:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.2 }
    });
    
    let result = response.text.trim();
    return result;
  } catch (err) {
    console.error("Gemini Error:", err.message);
    return text; // return original if failed
  }
}

async function run() {
  console.log("Starting Recipe Proofreading Process...");
  
  // We can fetch recipes that haven't been proofread yet.
  // Assuming we use a tag or just iterate over all. For this script, we'll iterate over all and 
  // maybe add a column or a tag, but let's just do a limited batch for demonstration.
  
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, description, full_ingredients')
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Supabase Error:", error);
    return;
  }

  console.log(`Fetched ${recipes.length} recipes to proofread.`);

  for (const recipe of recipes) {
    console.log(`\nProofreading ID ${recipe.id}: ${recipe.dish_name}`);
    
    const newDescription = await proofreadText(recipe.description);
    const newIngredients = await proofreadText(recipe.full_ingredients);
    
    // We can also proofread dish_name, but maybe risky if they are specific cultural names
    // Let's stick to description and ingredients which usually have the most typos.

    let hasChanges = false;
    const updates = {};
    
    if (newDescription && newDescription !== recipe.description) {
      updates.description = newDescription;
      hasChanges = true;
      console.log(" - Description corrected.");
    }
    
    if (newIngredients && newIngredients !== recipe.full_ingredients) {
      updates.full_ingredients = newIngredients;
      hasChanges = true;
      console.log(" - Ingredients corrected.");
    }

    if (hasChanges) {
      const { error: updateErr } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', recipe.id);
        
      if (updateErr) {
        console.error("Failed to update ID", recipe.id, updateErr);
      } else {
        console.log(" - Successfully updated database.");
      }
    } else {
      console.log(" - No typos found. Skipping.");
    }

    // Rate limit
    await sleep(1000);
  }
  
  console.log("\nProofreading batch complete!");
}

run();
