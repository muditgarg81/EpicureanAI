const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .ilike('dish_name', '%Butter Chicken%');

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Results found:', data.length);
    data.forEach(r => {
      console.log({
        id: r.id,
        dish_name: r.dish_name,
        cuisine: r.cuisine,
        is_vegetarian: r.is_vegetarian,
        is_vegan: r.is_vegan,
        is_gluten_free: r.is_gluten_free,
        contains_nuts: r.contains_nuts,
        contains_dairy: r.contains_dairy,
        total_time_min: r.total_time_min,
        ingredients: r.key_ingredients,
        full_ingredients: r.full_ingredients ? r.full_ingredients.substring(0, 100) + '...' : ''
      });
    });
  }
}

run();
