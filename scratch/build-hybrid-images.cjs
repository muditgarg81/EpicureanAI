require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const google = require('googlethis');
const { GoogleGenAI } = require('@google/genai');
const fetch = require('node-fetch');
const fs = require('fs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function getBase64Image(url) {
  try {
    const res = await globalThis.fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    if (!mimeType.startsWith('image/')) return null;
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      },
      url
    };
  } catch(e) {
    return null;
  }
}

async function processRecipe(recipe) {
  console.log(`\n--- Processing [${recipe.id}]: ${recipe.dish_name} ---`);
  
  try {
    const searchQuery = `${recipe.dish_name} ${recipe.cuisine || ''} food photography high resolution`;
    const images = await google.image(searchQuery, { safe: false });
    
    // Filter out known bad domains (like wikimedia, facebook)
    let candidates = images
      .filter(img => !img.url.includes('wikimedia') && !img.url.includes('facebook') && !img.url.includes('youtube'))
      .slice(0, 4)
      .map(img => img.url);

    if (candidates.length === 0) {
      console.log("No valid candidates found from Google.");
      return false;
    }

    const parts = [{ text: `Which of these images is the best representation of the dish '${recipe.dish_name}'? Please pick the one that looks the most delicious, has professional lighting, and clearly shows the food without any text, watermarks, or people. Output ONLY the index of the image (1, 2, 3, or 4).` }];
    const validCandidates = [];
    
    for (const url of candidates) {
      const base64Part = await getBase64Image(url);
      if (base64Part) {
        parts.push(base64Part.inlineData);
        validCandidates.push(url);
      }
    }

    if (validCandidates.length === 0) {
      console.log("Failed to download any images for Gemini.");
      return false;
    }

    console.log(`Asking Gemini to judge ${validCandidates.length} images...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts
    });
    
    const index = parseInt(response.text.trim()) - 1;
    if (index >= 0 && index < validCandidates.length) {
      const bestUrl = validCandidates[index];
      console.log(`Gemini selected: Image ${index + 1} -> ${bestUrl}`);
      
      // Update DB
      await supabase.from('recipes').update({ 
        image_url: bestUrl
      }).eq('id', recipe.id);
      
      // Mark as processed locally
      processedIds.add(recipe.id);
      fs.writeFileSync('scratch/processed_hybrid.json', JSON.stringify(Array.from(processedIds)));
      
      return true;
    } else {
      console.log(`Gemini gave an invalid response: ${response.text}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${recipe.dish_name}:`, error.message);
    return false;
  }
}

// Load processed IDs
let processedIds = new Set();
try {
  if (fs.existsSync('scratch/processed_hybrid.json')) {
    processedIds = new Set(JSON.parse(fs.readFileSync('scratch/processed_hybrid.json', 'utf8')));
  }
} catch(e) {}

async function run() {
  console.log("Fetching recipes to process...");
  
  // Fetch all recipes
  const { data: allRecipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, cuisine');
    
  if (error) {
    console.error("Supabase error:", error);
    return;
  }
  
  // Filter out already processed
  const recipes = allRecipes.filter(r => !processedIds.has(r.id)).slice(0, 100);

  console.log(`Found ${recipes.length} recipes in this batch.`);
  
  let successCount = 0;
  for (let i = 0; i < recipes.length; i++) {
    const success = await processRecipe(recipes[i]);
    if (success) successCount++;
    
    // Sleep to avoid ratelimits
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\nBatch finished. Successfully processed ${successCount} recipes.`);
}

run();
