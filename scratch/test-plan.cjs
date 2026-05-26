require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function run() {
  // 1. Fetch 100 random recipes from DB
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, cuisine, is_vegetarian, is_vegan, is_gluten_free')
    .limit(200);

  if (error) throw error;
  
  // Shuffle and take 60 to give AI some choice
  const shuffled = recipes.sort(() => 0.5 - Math.random()).slice(0, 60);
  
  const recipeList = shuffled.map(r => `ID: ${r.id} | Name: ${r.dish_name} | Cuisine: ${r.cuisine}`).join('\n');
  
  const prompt = `Act as an expert meal planner. I have a database of recipes. Here is a random selection of 60 recipes:
${recipeList}

Select exactly 21 unique recipes from this list to create a 7-day meal plan (3 meals per day: breakfast, lunch, dinner). 
Try your best to pick appropriate dishes for breakfast (e.g., breads, light dishes), lunch, and dinner.

Return ONLY a JSON object with this exact structure, containing only the IDs of the recipes you selected:
{
  "MON": { "breakfast": "ID", "lunch": "ID", "dinner": "ID" },
  "TUE": { "breakfast": "ID", "lunch": "ID", "dinner": "ID" },
  "WED": { "breakfast": "ID", "lunch": "ID", "dinner": "ID" },
  "THU": { "breakfast": "ID", "lunch": "ID", "dinner": "ID" },
  "FRI": { "breakfast": "ID", "lunch": "ID", "dinner": "ID" },
  "SAT": { "breakfast": "ID", "lunch": "ID", "dinner": "ID" },
  "SUN": { "breakfast": "ID", "lunch": "ID", "dinner": "ID" }
}`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  
  let text = result.text;
  if (text.includes('```json')) text = text.split('```json')[1].split('```')[0];
  else if (text.includes('```')) text = text.split('```')[1].split('```')[0];
  
  console.log(text.trim());
}

run().catch(console.error);
