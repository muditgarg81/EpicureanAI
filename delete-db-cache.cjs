require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deleteCache() {
  const { data, error } = await supabase.from('dish_images').delete().eq('dish_name', 'palak paneer');
  console.log('Deleted:', data, error);
}
deleteCache();
