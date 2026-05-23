require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWikipediaThumbnails(titles) {
  try {
    const titlesParam = titles.map(encodeURIComponent).join('|');
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${titlesParam}&prop=pageimages&format=json&pithumbsize=800`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KitchenCoachApp/1.0 (mudit@example.com)' }
    });
    const data = await response.json();
    
    if (!data || !data.query || !data.query.pages) return {};
    
    const results = {};
    Object.values(data.query.pages).forEach(page => {
      if (page.title && page.thumbnail && page.thumbnail.source) {
        results[page.title.toLowerCase()] = page.thumbnail.source;
      }
    });
    
    return results;
  } catch (error) {
    console.error("Wikipedia API error:", error.message);
    return {};
  }
}

async function run() {
  console.log("Fetching recipes from Supabase...");
  let allRecipes = [];
  let page = 0;
  const pageSize = 1000;
  
  // Fetch all recipes using pagination
  while (true) {
    const { data, error } = await supabase
      .from('recipes')
      .select('id, dish_name, image_url, wikipedia_url')
      .not('wikipedia_url', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error("Error fetching recipes:", error);
      process.exit(1);
    }
    
    if (!data || data.length === 0) break;
    allRecipes.push(...data);
    page++;
  }

  console.log(`Found ${allRecipes.length} recipes with Wikipedia URLs.`);

  // Filter and extract titles
  const validRecipes = allRecipes.filter(r => {
    try {
      const url = new URL(r.wikipedia_url);
      return url.hostname.includes('wikipedia.org') && url.pathname.startsWith('/wiki/');
    } catch (e) {
      return false;
    }
  }).map(r => {
    const url = new URL(r.wikipedia_url);
    const title = decodeURIComponent(url.pathname.replace('/wiki/', '')).replace(/_/g, ' ');
    return { ...r, wikiTitle: title };
  });

  console.log(`Extracting images for ${validRecipes.length} valid Wikipedia pages in batches...`);

  const BATCH_SIZE = 20; // Wikipedia API limit for normal users is 50, use 20 to be safe
  let updatedCount = 0;

  for (let i = 0; i < validRecipes.length; i += BATCH_SIZE) {
    const batch = validRecipes.slice(i, i + BATCH_SIZE);
    const titles = batch.map(r => r.wikiTitle);
    
    process.stdout.write(`Batch ${i / BATCH_SIZE + 1} (${batch.length} items)... `);
    
    const thumbnails = await fetchWikipediaThumbnails(titles);
    
    let batchUpdates = [];
    for (const recipe of batch) {
      const matchKey = recipe.wikiTitle.toLowerCase();
      const newUrl = thumbnails[matchKey];
      
      if (newUrl && newUrl !== recipe.image_url) {
        batchUpdates.push({
          id: recipe.id,
          image_url: newUrl
        });
      }
    }
    
    if (batchUpdates.length > 0) {
      // Use UPSERT by id to update image_url
      // Wait, since we are doing selective updates, we must include required fields if we use upsert, OR just use multiple updates.
      // Better to do a loop of .update() or a proper UPSERT with all required fields.
      // Since it's just update, we can loop `.update` concurrently.
      await Promise.all(batchUpdates.map(u => 
        supabase.from('recipes').update({ image_url: u.image_url }).eq('id', u.id)
      ));
      updatedCount += batchUpdates.length;
      console.log(`✅ Found and updated ${batchUpdates.length} images.`);
    } else {
      console.log(`➖ No new images found.`);
    }
    
    // Slight delay to respect API limits
    await delay(300);
  }

  console.log(`\nMigration complete! Updated a total of ${updatedCount} recipe images.`);
}

run();
