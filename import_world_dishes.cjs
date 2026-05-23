require('dotenv').config({ path: '.env.local' });
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const parseBool = (val) => {
  if (typeof val === 'string') {
    const l = val.trim().toLowerCase();
    return l === 'yes' || l === 'true' || l === '1' || l === 'y';
  }
  return Boolean(val);
};

const parseNum = (val) => {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
};

async function run() {
  console.log("Loading Excel file...");
  const workbook = xlsx.readFile('world_dishes_database.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet);
  
  console.log(`Loaded ${rawData.length} rows.`);

  const formattedData = rawData.map(row => ({
    // Omit 'id' completely to avoid Primary Key clashes. Let Supabase auto-increment new rows.
    dish_name: row.dish_name,
    alt_names: row.alt_names || null,
    country: row.country || null,
    region: row.region || null,
    cuisine: row.cuisine || null,
    course: row.course || null,
    dish_type: row.dish_type || null,
    key_ingredients: row.key_ingredients || null,
    full_ingredients: row.full_ingredients || null,
    method_summary: row.method_summary || null,
    detailed_recipe: row.detailed_recipe || null,
    prep_time_min: parseNum(row.prep_time_min),
    cook_time_min: parseNum(row.cook_time_min),
    total_time_min: parseNum(row.total_time_min),
    servings: parseNum(row.servings),
    difficulty: row.difficulty || null,
    spice_level: parseNum(row.spice_level),
    is_vegetarian: parseBool(row.is_vegetarian),
    is_vegan: parseBool(row.is_vegan),
    is_gluten_free: parseBool(row.is_gluten_free),
    contains_dairy: parseBool(row.contains_dairy),
    contains_nuts: parseBool(row.contains_nuts),
    description: row.description || null,
    image_url: row.image_url || null,
    wikipedia_url: row.wikipedia_url || null,
    image_search_query: row.image_search_query || null
  })).filter(r => r.dish_name); // Make sure dish_name exists

  // Deduplicate by dish_name
  const deduplicated = [];
  const seenNames = new Set();
  // Reverse to keep the latest/highest ID version if duplicates exist in Excel
  for (let i = formattedData.length - 1; i >= 0; i--) {
    const row = formattedData[i];
    const nameLower = row.dish_name.toLowerCase().trim();
    if (!seenNames.has(nameLower)) {
      seenNames.add(nameLower);
      deduplicated.unshift(row);
    }
  }

  console.log(`Filtered to ${deduplicated.length} valid unique rows.`);

  // Batch Upsert
  const BATCH_SIZE = 100;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < deduplicated.length; i += BATCH_SIZE) {
    const batch = deduplicated.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Uploading batch ${i / BATCH_SIZE + 1} (${batch.length} rows)... `);

    const { data, error } = await supabase
      .from('recipes')
      .upsert(batch, { onConflict: 'dish_name' });

    if (error) {
      console.log(`❌ Error`);
      console.error(error);
      failCount++;
      // Stop on first failure in case it's an RLS error so we don't spam
      console.log("Stopping early due to error.");
      break;
    } else {
      console.log(`✅ Success`);
      successCount += batch.length;
    }
  }

  console.log(`\nImport complete.`);
  console.log(`Successfully uploaded: ${successCount}`);
  if (failCount > 0) {
    console.log(`Failed batches: ${failCount}`);
  }
}

run();
