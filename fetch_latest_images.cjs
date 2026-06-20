require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('dish_images')
    .select('dish_name, image_url, created_at, source')
    .eq('source', 'ai_generated')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching images:", error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

run();
