require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const breakfastKeywords = ['pancake', 'waffle', 'omelet', 'egg', 'toast', 'porridge', 'upma', 'poha', 'idli', 'dosa', 'chila', 'paratha', 'muffin', 'crepe', 'bagel', 'breakfast'];
  const orCondition = breakfastKeywords.map(k => `dish_name.ilike.%${k}%,description.ilike.%${k}%`).join(',');
  
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name')
    .or(orCondition);
  
  console.log("Breakfast items found:", data ? data.length : "ERROR", error);
}

run().catch(console.error);
