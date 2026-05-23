require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const unsplashKey = process.env.VITE_UNSPLASH_ACCESS_KEY;

async function run() {
  const dishName = "masala chai";
  
  // Hardcoded known good Unsplash URL for Masala Chai:
  // "https://images.unsplash.com/photo-1561336437-01050a41f6a1?auto=format&fit=crop&w=800&q=80"
  
  console.log("Fetching from Unsplash API to get a fresh image...");
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent('masala chai tea indian')}&per_page=3&orientation=landscape`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Client-ID ${unsplashKey}` }
  });

  if (!response.ok) {
    console.error(`Unsplash API Error: ${response.status}`);
    // Fallback to hardcoded URL if rate limited
    await updateDB("https://images.unsplash.com/photo-1561336437-01050a41f6a1?auto=format&fit=crop&w=800&q=80");
    return;
  }

  const data = await response.json();
  if (data.results && data.results.length > 0) {
    // Pick the second result or first to ensure it's different
    const imageUrl = data.results[0].urls.regular;
    await updateDB(imageUrl);
  }
}

async function updateDB(imageUrl) {
  console.log("Updating Supabase with URL:", imageUrl);
  const { error } = await supabase
    .from('dish_images')
    .update({ image_url: imageUrl })
    .eq('dish_name', 'masala chai');

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success! Masala Chai updated.");
  }
}

run();
