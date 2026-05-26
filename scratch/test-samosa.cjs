require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, is_vegetarian')
    .ilike('dish_name', '%samosa%');
  
  console.log("Samosas in DB:");
  data.forEach(d => console.log(d.dish_name));
}
run().catch(console.error);
