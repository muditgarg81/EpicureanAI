require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const UNSPLASH_ACCESS_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.VITE_PEXELS_API_KEY;

const BATCH_SIZE = 50;

async function run() {
  console.log("Starting Waterfall Pre-loader for missing dishes...");

  const { data: dishes, error } = await supabase
    .from('recipes')
    .select('id, dish_name');

  if (error) {
    console.error("Error fetching dishes:", error);
    return;
  }

  const { data: existingImages } = await supabase
    .from('dish_images')
    .select('dish_name');
    
  const existingSet = new Set(existingImages.map(img => img.dish_name.toLowerCase()));
  
  const missingDishes = dishes.filter(d => !existingSet.has(d.dish_name.toLowerCase()));
  console.log(`Found ${missingDishes.length} dishes that need images.`);

  let processed = 0;
  let found = 0;

  for (const dish of missingDishes) {
    processed++;
    
    // Clean name for searching
    const searchName = dish.dish_name.replace(/\([^)]*\)/g, '').trim();
    const words = searchName.split(/\s+/);
    let optimizedSearchName = searchName;
    if (words.length > 1) {
      const baseDish = words.pop();
      const variations = words.join(' ');
      optimizedSearchName = `${baseDish} ${variations}`;
    }

    let finalUrl = null;
    let finalSource = 'none';

    // 1. Wikipedia
    try {
      const wpRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchName)}&utf8=&format=json&origin=*`);
      const wpData = await wpRes.json();
      if (wpData.query?.search?.length > 0) {
        const bestTitle = wpData.query.search[0].title;
        const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(bestTitle)}&origin=*`);
        const imgData = await imgRes.json();
        const pages = Object.values(imgData.query.pages);
        if (pages.length > 0 && pages[0].original?.source) {
          finalUrl = pages[0].original.source;
          finalSource = 'wikipedia';
        }
      }
    } catch(e) {}

    // 2. Unsplash
    if (!finalUrl && UNSPLASH_ACCESS_KEY) {
      try {
        let uRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(optimizedSearchName + ' food')}&per_page=1&orientation=landscape`, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
        let uData = await uRes.json();
        if (uData.results?.length > 0) {
          finalUrl = uData.results[0].urls.regular;
          finalSource = 'unsplash';
        }
      } catch(e) {}
    }

    // 3. MealDB
    if (!finalUrl) {
      try {
        const mRes = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(optimizedSearchName)}`);
        const mData = await mRes.json();
        if (mData.meals?.[0]?.strMealThumb) {
          finalUrl = mData.meals[0].strMealThumb;
          finalSource = 'mealdb';
        }
      } catch(e) {}
    }

    if (finalUrl) {
      found++;
      const { error: dbError } = await supabase
        .from('dish_images')
        .insert({
          dish_name: dish.dish_name.toLowerCase(),
          image_url: finalUrl,
          source: finalSource,
          image_verified: false
        });
      if (dbError) console.error("DB Insert Error:", dbError);
    }
    
    // Print progress every 50
    if (processed % 50 === 0) {
      console.log(`Processed ${processed}/${missingDishes.length}... Found: ${found}`);
    }
  }

  console.log(`\nWaterfall complete! Found images for ${found} out of ${missingDishes.length} dishes.`);
}

run();
