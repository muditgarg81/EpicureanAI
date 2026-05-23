const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('recipes').select('id, dish_name, cuisine, total_time_min, is_vegetarian, is_vegan, is_gluten_free, contains_dairy, contains_nuts, key_ingredients');
  if (error) {
    console.error('Error fetching recipes:', error);
  } else {
    console.log(`Found ${data.length} recipes in DB:`);
    data.forEach(r => {
      console.log(`- [${r.id}] ${r.dish_name} (${r.cuisine}) - Time: ${r.total_time_min} mins - Vegetarian: ${r.is_vegetarian} - Vegan: ${r.is_vegan} - GF: ${r.is_gluten_free}`);
      console.log(`  Ingredients: ${r.key_ingredients}`);
    });
  }
}

run();
