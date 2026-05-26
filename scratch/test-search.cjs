require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const query = "Butter Chicken"; // Sample query that user might click
  const maxTime = null;
  const dietary = {};
  const ingredients = [];
  const lowerQuery = query.toLowerCase();

  const dbFilters = {};
  
  let dbNameQb = supabase.from('recipes').select('*');
  Object.entries(dbFilters).forEach(([col, val]) => { dbNameQb = dbNameQb.eq(col, val); });
  if (maxTime) dbNameQb = dbNameQb.lte('total_time_min', maxTime);
  if (dietary.spicy) dbNameQb = dbNameQb.gt('spice_level', 0);
  dbNameQb = dbNameQb.ilike('dish_name', `%${query}%`).limit(10);

  let dbQb = supabase.from('recipes').select('*');
  Object.entries(dbFilters).forEach(([col, val]) => { dbQb = dbQb.eq(col, val); });
  if (maxTime) dbQb = dbQb.lte('total_time_min', maxTime);
  if (dietary.spicy) dbQb = dbQb.gt('spice_level', 0);
  if (ingredients.length > 0) {
    const orConditions = [];
    ingredients.forEach((ing) => {
      orConditions.push(`key_ingredients.ilike.%${ing}%`);
      orConditions.push(`dish_name.ilike.%${ing}%`);
      orConditions.push(`cuisine.ilike.%${ing}%`);
      orConditions.push(`description.ilike.%${ing}%`);
    });
    dbQb = dbQb.or(orConditions.join(','));
  } else if (query) {
    dbQb = dbQb.or(`description.ilike.%${query}%,cuisine.ilike.%${query}%`);
  }
  dbQb = dbQb.limit(20);

  const [res1, res2] = await Promise.all([dbNameQb, dbQb]);
  console.log("res1 count:", res1.data ? res1.data.length : 0);
  if (res1.data && res1.data.length > 0) console.log("res1[0]:", res1.data[0].dish_name);
  
  console.log("res2 count:", res2.data ? res2.data.length : 0);
  if (res2.data && res2.data.length > 0) console.log("res2[0]:", res2.data[0].dish_name);
}

run().catch(console.error);
