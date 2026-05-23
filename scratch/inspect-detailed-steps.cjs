const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const ids = [960, 975];
  for (const id of ids) {
    const { data, error } = await supabase.from('recipes').select('id, dish_name, detailed_recipe').eq('id', id).single();
    if (error) {
      console.error(`Error for ID ${id}:`, error);
    } else {
      console.log(`\n=================== ID ${id}: ${data.dish_name} ===================`);
      console.log(data.detailed_recipe);
    }
  }
}

run();
