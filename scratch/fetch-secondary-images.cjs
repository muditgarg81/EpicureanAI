require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const SPOONACULAR_API_KEY = process.env.VITE_SPOONACULAR_API_KEY || '';

async function getMealDbImage(dishName) {
  try {
    const res = await globalThis.fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(dishName)}`);
    const data = await res.json();
    if (data.meals && data.meals.length > 0) {
      return data.meals[0].strMealThumb; // Direct high-quality JPG
    }
  } catch(e) {
    console.error(`MealDB error for ${dishName}:`, e.message);
  }
  return null;
}

async function getSpoonacularImage(dishName) {
  if (!SPOONACULAR_API_KEY) return null;
  try {
    const res = await globalThis.fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(dishName)}&number=1&apiKey=${SPOONACULAR_API_KEY}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].image; // Direct JPG
    }
  } catch(e) {
    console.error(`Spoonacular error for ${dishName}:`, e.message);
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

  console.log(`Found ${recipes.length} recipes that need secondary database fetching.`);
  if (!SPOONACULAR_API_KEY) {
    console.log("⚠️ SPOONACULAR_API_KEY is not set in .env.local. Will only use TheMealDB.");
  }
  
  let successCount = 0;
  
  for (const recipe of recipes) {
    console.log(`\nSearching databases for: ${recipe.dish_name}...`);
    
    // 1. Try TheMealDB
    let imageUrl = await getMealDbImage(recipe.dish_name);
    
    if (imageUrl) {
      console.log(`  -> Found in TheMealDB: ${imageUrl}`);
    } else {
      // 2. Try Spoonacular (if API key is present)
      imageUrl = await getSpoonacularImage(recipe.dish_name);
      if (imageUrl) {
        console.log(`  -> Found in Spoonacular: ${imageUrl}`);
      } else {
        console.log(`  -> Not found in any secondary database.`);
      }
    }
    
    if (imageUrl) {
      await supabase.from('recipes').update({ image_url: imageUrl }).eq('id', recipe.id);
      successCount++;
    }
    
    // Slight delay to respect free API rate limits
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nDONE! Successfully extracted and updated ${successCount} images from secondary databases.`);
}

run();
