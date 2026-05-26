const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'KitchenCoachBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function testCommons(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json&gsrlimit=1`;
  const res = await fetchJson(url);
  if (res && res.query && res.query.pages) {
    const pages = Object.values(res.query.pages);
    if (pages.length > 0 && pages[0].imageinfo) {
      return pages[0].imageinfo[0].url;
    }
  }
  return null;
}

async function testMealDB(query) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
  const res = await fetchJson(url);
  if (res && res.meals && res.meals.length > 0) {
    return res.meals[0].strMealThumb;
  }
  return null;
}

async function run() {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, dish_name, image_url')
    .is('image_url', null)
    .limit(10);
    
  console.log(`Testing APIs for ${recipes.length} recipes without images:`);
  
  for (const r of recipes) {
    const commons = await testCommons(r.dish_name);
    const mealdb = await testMealDB(r.dish_name);
    
    console.log(`- ${r.dish_name}:`);
    console.log(`  Commons: ${commons || 'Not found'}`);
    console.log(`  MealDB:  ${mealdb || 'Not found'}`);
  }
}

run();
