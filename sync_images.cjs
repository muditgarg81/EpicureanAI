require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function syncImages() {
  console.log("Fetching all dish_images...");
  const { data: images, error: err1 } = await supabase
    .from('dish_images')
    .select('dish_name, image_url')
    .eq('source', 'ai_generated');

  if (err1) {
    console.error("Error fetching dish_images:", err1);
    return;
  }

  console.log(`Found ${images.length} AI images. Updating recipes table...`);

  let updatedCount = 0;
  for (const img of images) {
    // We do a case-insensitive match just to be safe
    const { data, error } = await supabase
      .from('recipes')
      .update({ image_url: img.image_url })
      .ilike('dish_name', img.dish_name);

    if (error) {
      console.error(`Error updating ${img.dish_name}:`, error);
    } else {
      updatedCount++;
    }
  }

  console.log(`Successfully synced ${updatedCount} recipes with AI images.`);
}

syncImages();
