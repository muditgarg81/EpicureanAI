require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function needsUpdate(url) {
  if (!url) return true;
  // If it's a google image search link
  if (url.includes('google.com/search')) return true;
  // Broken wikipedia
  if (url.includes('wikipedia.org/wiki/') && !url.includes('upload.wikimedia.org')) return true;
  // Generic placeholders
  if (url.includes('loremflickr.com') || url.includes('unsplash.com')) return true;
  return false;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'KitchenCoachBot/1.0 (mudit@example.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function getCommonsImage(dishName) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(dishName)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json&gsrlimit=1&iiurlwidth=800`;
    const res = await fetchJson(url);
    if (res && res.query && res.query.pages) {
      const pages = Object.values(res.query.pages);
      if (pages.length > 0 && pages[0].imageinfo && pages[0].imageinfo.length > 0) {
        return pages[0].imageinfo[0].thumburl || pages[0].imageinfo[0].url;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

async function getMealDBImage(dishName) {
  try {
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(dishName)}`;
    const res = await fetchJson(url);
    if (res && res.meals && res.meals.length > 0) {
      return res.meals[0].strMealThumb;
    }
  } catch (e) { /* ignore */ }
  return null;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log("Fetching all recipes to identify generic/Google search images...");
  let allRecipes = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('recipes')
      .select('id, dish_name, image_url')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRecipes.push(...data);
    page++;
  }

  const recipesToUpdate = allRecipes.filter(r => needsUpdate(r.image_url));
  console.log(`Found ${recipesToUpdate.length} recipes out of ${allRecipes.length} needing real images.`);

  let successCount = 0;
  const BATCH_SIZE = 10;

  for (let i = 0; i < recipesToUpdate.length; i += BATCH_SIZE) {
    const batch = recipesToUpdate.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(recipesToUpdate.length / BATCH_SIZE)}... `);
    
    const updates = [];
    for (const recipe of batch) {
      let newUrl = await getCommonsImage(recipe.dish_name);
      if (!newUrl) newUrl = await getMealDBImage(recipe.dish_name);
      
      if (newUrl) {
        updates.push({ id: recipe.id, dish_name: recipe.dish_name, image_url: newUrl });
      }
      await delay(100);
    }
    
    if (updates.length > 0) {
      await Promise.all(updates.map(u => 
        supabase.from('recipes').update({ image_url: u.image_url }).eq('id', u.id)
      ));
      
      successCount += updates.length;
      console.log(`✅ Updated ${updates.length} images.`);
    } else {
      console.log(`➖ No matches found.`);
    }
  }

  console.log(`\nComplete! Successfully replaced ${successCount} broken/generic links with real dish photos.`);
}

run().catch(console.error);
