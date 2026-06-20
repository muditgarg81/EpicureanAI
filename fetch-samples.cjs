require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase
    .from('dish_images')
    .select('dish_name, image_url')
    .eq('source', 'ai_generated')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('AI Images:', JSON.stringify(data, null, 2));
}
run();
