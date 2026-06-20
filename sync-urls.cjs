require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: images } = await supabase.from('dish_images').select('dish_name, image_url');
  console.log(`Found ${images.length} images to sync...`);
  
  let synced = 0;
  for (const img of images) {
    const { error } = await supabase
      .from('recipes')
      .update({ image_url: img.image_url })
      .ilike('dish_name', img.dish_name);
      
    if (!error) synced++;
  }
  
  console.log(`Successfully synced ${synced} recipe URLs!`);
}

run();
