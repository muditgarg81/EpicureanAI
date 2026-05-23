const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .or('dish_name.ilike.%Butter Chicken%,dish_name.ilike.%Chicken Tikka Masala%,dish_name.ilike.%Tandoori Chicken%');

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    data.forEach(r => {
      console.log({
        dish_name: r.dish_name,
        is_vegetarian: r.is_vegetarian,
        is_vegan: r.is_vegan,
        is_gluten_free: r.is_gluten_free,
        contains_nuts: r.contains_nuts,
        contains_dairy: r.contains_dairy,
        full_ingredients: r.full_ingredients ? r.full_ingredients.substring(0, 150) + '...' : ''
      });
    });
  }
}

run();
