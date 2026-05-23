require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const dishName = "masala chai";
  
  // Authentic Wikimedia Commons image (Chai in a traditional Sakora/Kullhad)
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/8/89/Chai_In_Sakora.jpg";
  
  console.log("Inserting into Supabase dish_images table...");
  const { error } = await supabase
    .from('dish_images')
    .upsert(
      { dish_name: dishName, image_url: imageUrl, source: 'wikimedia' },
      { onConflict: 'dish_name' }
    );

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success! Authentic Masala Chai inserted/updated.");
  }
}

run();
