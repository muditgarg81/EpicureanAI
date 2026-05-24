require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, detailed_recipe')
    .ilike('dish_name', '%cappuccino%');
  console.log("DB Matches:", JSON.stringify(data, null, 2));
}
check();
