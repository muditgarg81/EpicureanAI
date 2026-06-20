require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAchari() {
  const { data: recipe, error: err1 } = await supabase
    .from('recipes')
    .select('dish_name, image_url')
    .ilike('dish_name', '%Achari Chicken%');

  console.log("Recipes table:");
  console.log(recipe);

  const { data: img, error: err2 } = await supabase
    .from('dish_images')
    .select('dish_name, image_url, source')
    .ilike('dish_name', '%Achari Chicken%');

  console.log("\ndish_images table:");
  console.log(img);
}

checkAchari();
