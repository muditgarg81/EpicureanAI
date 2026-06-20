require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function countImages() {
  const { count, error } = await supabase
    .from('dish_images')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'ai_generated');

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Total AI Generated Images: ${count}`);
  }
}

countImages();
