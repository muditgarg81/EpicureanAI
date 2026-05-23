const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: cuisines } = await supabase.from('recipes').select('cuisine');
  const uniqueCuisines = [...new Set(cuisines.map(r => r.cuisine))];
  console.log('Unique cuisines:', uniqueCuisines);

  const { data: spices } = await supabase.from('recipes').select('spice_level');
  const uniqueSpices = [...new Set(spices.map(r => r.spice_level))];
  console.log('Unique spice levels:', uniqueSpices);

  const { data: counts } = await supabase.from('recipes').select('is_vegetarian, is_vegan, is_gluten_free');
  console.log('Total recipes in DB:', counts.length);
  console.log('Vegetarian in DB:', counts.filter(r => r.is_vegetarian).length);
  console.log('Vegan in DB:', counts.filter(r => r.is_vegan).length);
  console.log('Gluten-free in DB:', counts.filter(r => r.is_gluten_free).length);
}

check();
