require('dotenv').config({ path: '.env.local' });
// polyfill fetch if needed for unifiedSearchService
// Actually just write a test specifically for the logic:

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const query = 'vegetarian recipes';
  const filters = { ingredients: [], dietary: {}, maxTime: null };
  const { ingredients, dietary, maxTime } = filters;
  const lowerQuery = query.toLowerCase();
  
  const isGeneric = ['vegetarian', 'vegan', 'gluten', 'spicy', 'cuisine', 'meals', 'recipes', 'dishes', 'world', 'global', 'easy', 'quick'].some(w => lowerQuery.includes(w)) && ingredients.length === 0;
  console.log('isGeneric:', isGeneric);

  const dbFilters = {};
  if (dietary.vegan || lowerQuery.includes('vegan'))       dbFilters.is_vegan       = true;
  if (dietary.vegetarian || lowerQuery.includes('vegetarian'))  dbFilters.is_vegetarian  = true;
  if (dietary.glutenFree || lowerQuery.includes('gluten'))  dbFilters.is_gluten_free = true;

  console.log('dbFilters:', dbFilters);

  let dbQb = supabase.from('recipes').select('*');
  Object.entries(dbFilters).forEach(([col, val]) => { dbQb = dbQb.eq(col, val); });
  if (maxTime) dbQb = dbQb.lte('total_time_min', maxTime);
  if (dietary.spicy) dbQb = dbQb.gt('spice_level', 0);
  
  if (ingredients.length > 0) {
     console.log('ingredients > 0');
  } else if (!isGeneric && query) {
     console.log('not generic and query');
  } else {
     console.log('generic query, just limit 40');
  }
  
  dbQb = dbQb.limit(40);

  const { data, error } = await dbQb;
  console.log("DB returned:", data ? data.length : "ERROR", error);
}

run().catch(console.error);
