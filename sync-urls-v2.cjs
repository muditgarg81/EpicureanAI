require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: images } = await supabase.from('dish_images').select('dish_name, image_url');
  console.log(`Found ${images.length} images to sync...`);
  
  const { data: recipes } = await supabase.from('recipes').select('id, dish_name');
  
  let synced = 0;
  for (const img of images) {
    const targetRecipe = recipes.find(r => r.dish_name.toLowerCase().trim() === img.dish_name.toLowerCase().trim());
    
    if (targetRecipe) {
      const { error } = await supabase
        .from('recipes')
        .update({ image_url: img.image_url })
        .eq('id', targetRecipe.id);
        
      if (!error) synced++;
      else console.error("Error updating", targetRecipe.dish_name, error);
    }
  }
  
  console.log(`Successfully synced ${synced} recipe URLs!`);
}

run();
