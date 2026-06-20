require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function syncImages() {
  const { data: images, error } = await supabase.from('dish_images').select('dish_name, image_url').eq('source', 'ai_generated');
  if (error) {
    console.error("Error fetching images:", error);
    return;
  }
  
  console.log(`Found ${images.length} AI images to sync to recipes table.`);
  
  for (const img of images) {
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ image_url: img.image_url })
      .ilike('dish_name', img.dish_name); // fuzzy match since dish_images name is lowercase
      
    if (updateError) {
      console.error(`Failed to update recipe ${img.dish_name}:`, updateError);
    } else {
      console.log(`Synced ${img.dish_name}`);
    }
  }
  console.log("Sync complete!");
}

syncImages();
