const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const unsplashKey = process.env.VITE_UNSPLASH_ACCESS_KEY;

if (!supabaseUrl || !supabaseKey || !unsplashKey) {
  console.error("Missing environment variables. Check .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 75 seconds delay to stay under the 50/hr free tier limit
const DELAY_MS = 75000; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runMigration() {
  console.log("Starting Unsplash -> Supabase Image Migration...");
  
  // 1. Fetch all unique dishes from recipes
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('dish_name');

  if (recipesError) {
    console.error("Error fetching recipes:", recipesError);
    return;
  }

  // Deduplicate dish names
  const uniqueDishes = [...new Set(recipes.map(r => r.dish_name))].filter(Boolean);
  console.log(`Found ${uniqueDishes.length} unique dishes to process.`);

  // 2. Iterate and process
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const dishName of uniqueDishes) {
    const cleanName = dishName.toLowerCase().trim();

    // Check if it already exists in dish_images
    const { data: existing } = await supabase
      .from('dish_images')
      .select('id')
      .eq('dish_name', cleanName)
      .single();

    if (existing) {
      console.log(`[SKIPPED] "${dishName}" already exists in database.`);
      skipped++;
      continue;
    }

    console.log(`[FETCHING] Unsplash image for "${dishName}"...`);
    
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food dish')}&per_page=1&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Client-ID ${unsplashKey}` }
      });

      if (!response.ok) {
        console.error(`Unsplash API Error for ${dishName}: ${response.status}`);
        errors++;
        if (response.status === 403) {
            console.error("RATE LIMIT REACHED! Stopping migration.");
            break;
        }
      } else {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const imageUrl = data.results[0].urls.regular;
          
          // Insert to Supabase
          const { error: insertError } = await supabase
            .from('dish_images')
            .insert([{ dish_name: cleanName, image_url: imageUrl, source: 'unsplash' }]);

          if (insertError) {
             console.error(`[ERROR] Failed to save "${dishName}" to Supabase:`, insertError.message);
             errors++;
          } else {
             console.log(`[SUCCESS] Saved image for "${dishName}"`);
             processed++;
          }
        } else {
          console.log(`[WARN] No Unsplash results for "${dishName}"`);
        }
      }
    } catch (e) {
      console.error(`[ERROR] Processing "${dishName}":`, e.message);
      errors++;
    }

    // Wait before next request to respect rate limits
    console.log(`Waiting ${DELAY_MS / 1000} seconds to respect Unsplash rate limit...`);
    await sleep(DELAY_MS);
  }

  console.log("\nMigration Complete!");
  console.log(`Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
}

runMigration();
