require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, wikipedia_url, image_url')
    .in('dish_name', ['Irish Coffee', 'Long Island Iced Tea', 'Singapore Sling', 'Cosmopolitan']);
  console.log(data);
}
check();
