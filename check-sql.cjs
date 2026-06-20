require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('dish_images').select('image_id').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Schema exists! Data:', data);
  }
}
run();
