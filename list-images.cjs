require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listImages() {
  const { data, error } = await supabase
    .from('dish_images')
    .select('dish_name, source, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error("Error fetching images:", error);
    return;
  }
  
  const aiImages = data.filter(d => d.source === 'ai_generated' || d.source === 'imagen4');
  console.log(`Found ${aiImages.length} AI generated images (showing recent 50):`);
  aiImages.forEach(img => {
    console.log(`- ${img.dish_name} (Created: ${new Date(img.created_at).toLocaleString()})`);
  });
}

listImages();
