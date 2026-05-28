require('dotenv').config({ path: '.env.local' });
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Loading Excel file to restore original Wikipedia images...");
  const workbook = xlsx.readFile('world_dishes_database.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = xlsx.utils.sheet_to_json(sheet);
  
  console.log(`Loaded ${rawData.length} rows from Excel.`);
  
  // Create a map of dish_name -> original image_url
  const imageMap = new Map();
  for (const row of rawData) {
    if (row.dish_name && row.image_url) {
      imageMap.set(row.dish_name.trim().toLowerCase(), row.image_url);
    }
  }
  
  console.log(`Found ${imageMap.size} unique dishes with images in Excel.`);

  console.log("Fetching current recipes from Supabase...");
  const { data: recipes, error } = await supabase.from('recipes').select('id, dish_name');
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${recipes.length} recipes in Supabase. Restoring images...`);
  
  let restoredCount = 0;
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const chunk = recipes.slice(i, i + BATCH_SIZE);
    
    const promises = chunk.map(recipe => {
      const name = recipe.dish_name.trim().toLowerCase();
      const originalUrl = imageMap.get(name);
      if (originalUrl) {
        restoredCount++;
        return supabase.from('recipes').update({ image_url: originalUrl }).eq('id', recipe.id);
      }
      return Promise.resolve();
    });
    
    await Promise.all(promises);
    if (i % 500 === 0 && i > 0) console.log(`Processed ${i} recipes...`);
  }
  
  console.log(`\nDONE! Restored original images for ${restoredCount} recipes!`);
}

run().catch(console.error);
