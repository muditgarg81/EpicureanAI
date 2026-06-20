const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { count, error } = await supabase.from('recipes').select('*', { count: 'exact', head: true }).is('image_url', null);
  console.log("Recipes missing image_url:", count);
}
check();
