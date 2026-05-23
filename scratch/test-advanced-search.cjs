const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery(queryText) {
  console.log(`\n=================== SEARCHING: "${queryText}" ===================`);
  const lower = queryText.toLowerCase();

  // Extract time
  const timeMatch = lower.match(/(\d+)\s*(?:min|mins|minute|minutes)/);
  const maxTime = timeMatch ? parseInt(timeMatch[1], 10) : null;

  // Extract dietary
  const dietary = {
    vegan: /\bvegan\b/.test(lower),
    vegetarian: /\bvegetarian\b/.test(lower),
    glutenFree: /\bgluten.?free\b/.test(lower),
    dairyFree: /\bdairy.?free\b/.test(lower),
  };

  // Noun stop words
  const EXCLUDED_WORDS = new Set([
    'recipe', 'recipes', 'dish', 'dishes', 'meal', 'meals', 'cuisine', 'cuisines',
    'world', 'global', 'food', 'foods', 'dinner', 'lunch', 'breakfast', 'snack',
    'under', 'over', 'between', 'around', 'approx', 'minutes', 'mins', 'min',
    'hours', 'hrs', 'hr', 'seconds', 'secs', 'sec', 'time', 'times',
    'vegetarian', 'vegan', 'gluten', 'free', 'dairy'
  ]);

  const STOP_WORDS = new Set([
    'i', 'have', 'got', 'want', 'a', 'an', 'the', 'and', 'or', 'with', 'some',
    'make', 'cook', 'prepare', 'need', 'using', 'use', 'can', 'me', 'something',
    'what', 'how', 'find', 'show', 'about', 'for', 'of', 'in', 'to', 'only', 'just',
    'something', 'anything', 'please', 'help', 'quick', 'fast', 'easy', 'simple',
  ]);

  // Extract search tokens
  const tokens = lower
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t) && !EXCLUDED_WORDS.has(t));

  console.log('Parsed query:', { maxTime, dietary, tokens });

  let qb = supabase.from('recipes').select('id, dish_name, cuisine, total_time_min, key_ingredients');

  // Apply dietary filters
  if (dietary.vegan) qb = qb.eq('is_vegan', true);
  if (dietary.vegetarian) qb = qb.eq('is_vegetarian', true);
  if (dietary.glutenFree) qb = qb.eq('is_gluten_free', true);
  if (dietary.dairyFree) qb = qb.eq('contains_dairy', false);

  if (maxTime) {
    qb = qb.lte('total_time_min', maxTime);
  }

  // Check if user queried for spicy
  if (/\bspicy\b/i.test(lower) || /\bspice\b/i.test(lower)) {
    qb = qb.gt('spice_level', 0);
  }

  if (tokens.length > 0) {
    const orConditions = [];
    tokens.forEach(t => {
      orConditions.push(
        `dish_name.ilike.%${t}%`,
        `key_ingredients.ilike.%${t}%`,
        `cuisine.ilike.%${t}%`,
        `description.ilike.%${t}%`
      );
    });
    qb = qb.or(orConditions.join(','));
  }

  const { data, error } = await qb.limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Results count: ${data.length}`);
    data.forEach(r => {
      console.log(`- [${r.id}] ${r.dish_name} (${r.cuisine}) - Time: ${r.total_time_min}m`);
    });
  }
}

async function run() {
  await testQuery('vegetarian recipes');
  await testQuery('quick meals under 20 mins');
  await testQuery('spicy dishes');
  await testQuery('global cuisine world recipes');
  await testQuery('chicken tacos');
  await testQuery('Italian pasta');
}

run();
