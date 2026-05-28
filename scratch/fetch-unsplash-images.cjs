require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const UNSPLASH_API_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY || '';

async function getUnsplashImage(dishName) {
  if (!UNSPLASH_API_KEY) return null;
  try {
    const res = await globalThis.fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food')}&per_page=1&client_id=${UNSPLASH_API_KEY}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular; // High quality Unsplash JPG
    }
  } catch(e) {
    console.error(`Unsplash error for ${dishName}:`, e.message);
  }
  return null;
}

async function run() {
  console.log("Fetching recipes with broken/missing Wikipedia images...");
  
  // Find recipes that still have the Google search fallback URL
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, image_url')
    .like('image_url', '%google.com/search%');
    
  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  console.log(`Found ${recipes.length} recipes that need Unsplash images.`);
  if (!UNSPLASH_API_KEY) {
    console.log("⚠️ VITE_UNSPLASH_ACCESS_KEY is not set in .env.local. Cannot proceed.");
    return;
  }
  
  let successCount = 0;
  
  for (const recipe of recipes) {
    console.log(`\nSearching Unsplash for: ${recipe.dish_name}...`);
    
    const imageUrl = await getUnsplashImage(recipe.dish_name);
    
    if (imageUrl) {
      console.log(`  -> Found in Unsplash: ${imageUrl}`);
      await supabase.from('recipes').update({ image_url: imageUrl }).eq('id', recipe.id);
      successCount++;
    } else {
      console.log(`  -> Not found in Unsplash.`);
    }
    
    // Unsplash allows 50 requests per hour for demo apps, or more if approved. 
    // Wait slightly to respect limits.
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nDONE! Successfully extracted and updated ${successCount} images from Unsplash.`);
}

run();
