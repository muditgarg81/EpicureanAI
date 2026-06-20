require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error, count } = await supabase.from('dish_images').select('dish_name, image_url', { count: 'exact' });
  console.log(`Total rows: ${count}`);
  if (data) {
    console.log('Sample data:', data.slice(0, 5));
  }
}
check();
