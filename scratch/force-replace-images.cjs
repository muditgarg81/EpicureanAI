require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
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

async function run() {
  console.log("Fetching all recipes...");
  
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, cuisine, image_url')
    .not('image_url', 'is', null)
    .not('image_url', 'ilike', '%unsplash.com%');
    
  if (error) {
    console.error("Error fetching recipes:", error);
    return;
  }
  
  console.log(`Found ${recipes.length} non-Unsplash images to replace.`);
  
  let replacedCount = 0;
  
  // To avoid hitting rate limits too fast, we'll process sequentially with a delay
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    console.log(`[${i+1}/${recipes.length}] Replacing: ${recipe.dish_name}`);
    
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
    
    // Sleep to respect Unsplash API limits (they allow 50 reqs/hr usually on free tier, 
    // but if this is a paid key it's higher. Let's do 1 second delay to be safe)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\nDONE! Replaced ${replacedCount} images.`);
}

run().catch(console.error);
