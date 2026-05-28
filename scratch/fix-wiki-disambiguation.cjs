require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function searchWikiForFood(dishName) {
  try {
    const query = encodeURIComponent(`${dishName} food`);
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json`;
    const res = await globalThis.fetch(url);
    const data = await res.json();
    if (data.query && data.query.search && data.query.search.length > 0) {
      // Return the top result's URL
      const title = data.query.search[0].title;
      return `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    }
  } catch(e) {
    console.error(e.message);
  }
  return null;
}

async function extractWikiImage(url) {
  try {
    const res = await globalThis.fetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let imageUrl = $('meta[property="og:image"]').attr('content');
    if (imageUrl) {
      if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
      return imageUrl;
    }
    return null;
  } catch(e) {
    return null;
  }
}

async function run() {
  console.log("Fixing disambiguation for 'Puri' and testing script...");
  
  // Just testing for 'Puri' and maybe a few others known to be places (e.g. 'Brie' -> cheese or place, 'Hamburger' -> city or food, 'Sandwich' -> town)
  // Let's run a check on recipes where image URL contains 'map', 'temple', 'city', 'flag', 'coat_of_arms', 'locator', 'monument'
  
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, wikipedia_url, image_url')
    .not('image_url', 'is', null);
    
  if (error) return console.error(error);

  const badKeywords = ['map', 'temple', 'city', 'flag', 'coat_of_arms', 'locator', 'monument', 'skyline', 'building'];
  
  const badRecipes = recipes.filter(r => {
    // Explicitly catch Puri
    if (r.dish_name.toLowerCase() === 'puri') return true;
    
    const urlLower = r.image_url.toLowerCase();
    return badKeywords.some(kw => urlLower.includes(kw));
  });

  console.log(`Found ${badRecipes.length} recipes that might be pointing to places/cities instead of food.`);

  let fixCount = 0;
  for (const recipe of badRecipes) {
    console.log(`\nChecking: ${recipe.dish_name} (Current URL: ${recipe.wikipedia_url})`);
    const newWikiUrl = await searchWikiForFood(recipe.dish_name);
    
    if (newWikiUrl && newWikiUrl !== recipe.wikipedia_url) {
      console.log(`  -> Found better Wikipedia page: ${newWikiUrl}`);
      const newImageUrl = await extractWikiImage(newWikiUrl);
      if (newImageUrl && !badKeywords.some(kw => newImageUrl.toLowerCase().includes(kw))) {
        console.log(`  -> Extracted true food image: ${newImageUrl}`);
        await supabase.from('recipes').update({ 
          wikipedia_url: newWikiUrl, 
          image_url: newImageUrl 
        }).eq('id', recipe.id);
        fixCount++;
      } else {
        console.log(`  -> Image extracted from new page is also bad or null.`);
      }
    } else {
      console.log(`  -> No better Wikipedia page found.`);
    }
  }
  
  console.log(`\nDONE! Fixed ${fixCount} disambiguation issues.`);
}

run();
