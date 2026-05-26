require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const fetch = require('node-fetch'); // in case it's needed for node < 18, but Node 18+ has fetch natively

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const UNSPLASH_ACCESS_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;

async function fetchDishImageFromUnsplash(dishName, cuisine) {
  try {
    const query = encodeURIComponent(`${dishName} food dish`);
    const url = `https://api.unsplash.com/search/photos?page=1&query=${query}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`;
    
    const res = await globalThis.fetch(url);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    
    // Fallback search
    const fallbackQuery = encodeURIComponent(`${cuisine || 'delicious'} food`);
    const fallbackRes = await globalThis.fetch(`https://api.unsplash.com/search/photos?page=1&query=${fallbackQuery}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`);
    const fallbackData = await fallbackRes.json();
    if (fallbackData.results && fallbackData.results.length > 0) {
      return fallbackData.results[0].urls.regular;
    }
  } catch (error) {
    console.error(`Unsplash fetch failed for ${dishName}:`, error);
  }
  return null;
}

// Function to convert image URL to base64
async function urlToBase64(url) {
  try {
    const response = await globalThis.fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: mimeType
      }
    };
  } catch (error) {
    console.error(`Failed to fetch image ${url}:`, error.message);
    return null;
  }
}

async function isPureDishImage(url) {
  if (url.includes('unsplash.com')) return true; // Trust unsplash images
  
  const imagePart = await urlToBase64(url);
  if (!imagePart) return false; // If we can't load it, consider it bad
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            imagePart,
            { text: "Look at this image. Is it purely a photograph of a food dish? Answer ONLY with YES or NO. Answer NO if the image contains any of the following: people, faces, text, menus, graphic illustrations, collages, or logos." }
          ]
        }
      ],
      config: {
        temperature: 0.1
      }
    });
    
    const answer = response.text.trim().toUpperCase();
    return answer.includes('YES');
  } catch (err) {
    console.error(`Gemini analysis failed for ${url}:`, err.message);
    return true; // Fallback to keeping it if API fails to avoid breaking everything
  }
}

async function run() {
  console.log("Fetching all recipes...");
  
  // We'll process them in batches of 20
  let { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, cuisine, image_url')
    .not('image_url', 'is', null)
    .not('image_url', 'ilike', '%unsplash.com%'); // Skip unsplash images as they are already good
    
  if (error) {
    console.error("Error fetching recipes:", error);
    return;
  }
  
  console.log(`Found ${recipes.length} non-Unsplash images to analyze.`);
  
  let replacedCount = 0;
  
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    console.log(`[${i+1}/${recipes.length}] Analyzing: ${recipe.dish_name} - ${recipe.image_url}`);
    
    const isPure = await isPureDishImage(recipe.image_url);
    
    if (!isPure) {
      console.log(`  -> BAD IMAGE DETECTED (People/Text/Menu). Replacing...`);
      const newUrl = await fetchDishImageFromUnsplash(recipe.dish_name, recipe.cuisine);
      
      if (newUrl) {
        await supabase
          .from('recipes')
          .update({ image_url: newUrl })
          .eq('id', recipe.id);
        console.log(`  -> Replaced with: ${newUrl}`);
        replacedCount++;
      } else {
        console.log(`  -> Could not find Unsplash replacement.`);
      }
    } else {
      console.log(`  -> GOOD IMAGE.`);
    }
    
    // Tiny delay to respect API limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\nDONE! Scanned ${recipes.length} images. Replaced ${replacedCount} bad images.`);
}

run().catch(console.error);
