require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, detailed_recipe')
    .ilike('dish_name', '%Lasagna alla Bolognese%');
  
  console.log("DB search data:", data);
}
run().catch(console.error);
