require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, image_url')
    .limit(20);
    
  if (error) throw error;
  console.log("Sample of current image URLs:");
  data.forEach(d => console.log(`${d.dish_name}: ${d.image_url ? d.image_url.substring(0,60) + '...' : 'NULL'}`));
}

run().catch(console.error);
