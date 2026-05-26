require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, total_time_min')
    .lte('total_time_min', 20);
  
  console.log("Recipes under 20 mins:", data ? data.length : 0);
  
  const { data: d2 } = await supabase
    .from('recipes')
    .select('dish_name, is_vegetarian')
    .eq('is_vegetarian', true);
  console.log("Vegetarian recipes:", d2 ? d2.length : 0);
}
run().catch(console.error);
