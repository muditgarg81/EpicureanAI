import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Fetching recipes with google.com image URLs...');
  
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, image_url')
    .ilike('image_url', '%google.com%');

  if (error) {
    console.error('Error fetching recipes:', error);
    return;
  }

  console.log(`Found ${recipes.length} recipes with Google image links.`);

  if (recipes.length === 0) return;

  const idsToUpdate = recipes.map(r => r.id);

  console.log('Clearing image_url for these recipes...');
  
  const { error: updateError } = await supabase
    .from('recipes')
    .update({ image_url: null })
    .in('id', idsToUpdate);

  if (updateError) {
    console.error('Error updating recipes:', updateError);
  } else {
    console.log('Successfully cleared old Google Image links. The new Waterfall service will now take over.');
  }
}

run();
