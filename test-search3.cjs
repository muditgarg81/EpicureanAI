require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const query = "vegetarian recipes";
  const lowerQuery = query.toLowerCase();
  const dbFilters = { is_vegetarian: true };

  let dbQb = supabase.from('recipes').select('dish_name, is_vegetarian');
  Object.entries(dbFilters).forEach(([col, val]) => { dbQb = dbQb.eq(col, val); });
  
  dbQb = dbQb.or(`description.ilike.%ramen%,dish_name.ilike.%ramen%`);
  
  dbQb = dbQb.range(0, 40);
  
  const { data, error } = await dbQb;
  console.log(data);
}
run();
