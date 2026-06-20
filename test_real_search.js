import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need to bypass the React-specific imports in unifiedSearchService to test it in Node
// Let's just replicate exactly what getUnifiedFullSearch does but directly here

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFullSearch() {
  const query = "Cornbread";
  const ingredients = ["cornbread"];
  const dietary = { vegan: false, vegetarian: false, glutenFree: false, spicy: false };
  const maxTime = null;
  const page = 1;
  const isGeneric = false;

  const lowerQuery = query.toLowerCase();

  const dbFilters = {};
  if (dietary.vegan || lowerQuery.includes('vegan'))       dbFilters.is_vegan       = true;
  if (dietary.vegetarian || lowerQuery.includes('vegetarian'))  dbFilters.is_vegetarian  = true;
  if (dietary.glutenFree || lowerQuery.includes('gluten'))  dbFilters.is_gluten_free = true;

  // 1. Supabase Exact Match Query
  let dbNameQb = supabase.from('recipes').select('*');
  Object.entries(dbFilters).forEach(([col, val]) => { dbNameQb = dbNameQb.eq(col, val); });
  if (maxTime) dbNameQb = dbNameQb.lte('total_time_min', maxTime);
  if (dietary.spicy) dbNameQb = dbNameQb.gt('spice_level', 0);
  if (!isGeneric && query) {
    dbNameQb = dbNameQb.ilike('dish_name', `%${query}%`);
  }
  dbNameQb = dbNameQb.limit(10);

  // 1b. Supabase Ingredients Match
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
  }
  
  const pageSize = 12;
  const startIdx = (page - 1) * pageSize;
  dbQb = dbQb.range(startIdx, startIdx + pageSize);

  console.log("Executing dbNameQb...");
  const dbNameRes = await dbNameQb;
  console.log("dbNameRes count:", dbNameRes.data?.length);
  
  console.log("Executing dbQb...");
  const dbRes = await dbQb;
  console.log("dbRes count:", dbRes.data?.length);
}

testFullSearch();
