require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function extractWikiImage(url) {
  try {
    const res = await globalThis.fetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Wikipedia exposes the main article image in the og:image meta tag
    let imageUrl = $('meta[property="og:image"]').attr('content');
    
    if (imageUrl) {
      // Ensure it's a full URL
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }
      return imageUrl;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function run() {
  console.log("Fetching recipes to fix Wikipedia images...");
  
  // We want to fetch recipes where wikipedia_url exists, and image_url is a google search URL
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, wikipedia_url')
    .not('wikipedia_url', 'is', null)
    .like('image_url', '%google.com/search%');
    
  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  console.log(`Found ${recipes.length} recipes that need Wikipedia image extraction.`);
  
  let successCount = 0;
  
  // Process in batches
  const BATCH_SIZE = 20;
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1}...`);
    
    const promises = batch.map(async (recipe) => {
      const jpgUrl = await extractWikiImage(recipe.wikipedia_url);
      if (jpgUrl) {
        await supabase.from('recipes').update({ image_url: jpgUrl }).eq('id', recipe.id);
        successCount++;
      }
    });
    
    await Promise.all(promises);
  }
  
  console.log(`\nDONE! Successfully extracted and updated ${successCount} Wikipedia JPGs.`);
}

run();
