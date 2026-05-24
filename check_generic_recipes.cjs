require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, detailed_recipe')
    .in('dish_name', ['Irish Coffee', 'Long Island Iced Tea', 'Singapore Sling', 'Filter Coffee (Mysore)', 'Coorg Coffee', 'Cosmopolitan']);
  console.log("DB Matches:", JSON.stringify(data.map(d => ({ name: d.dish_name, has_template: d.detailed_recipe.includes('UNDERSTAND YOUR BEVERAGE TYPE') })), null, 2));
}
check();
