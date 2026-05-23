const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSpecifics() {
  const { data, error } = await supabase.from('recipes').select('id, dish_name, detailed_recipe').in('id', [686, 700, 801]);
  if (error) {
    console.error(error);
    return;
  }
  for (const r of data) {
    console.log(`\n=================== ID: ${r.id} | ${r.dish_name} ===================`);
    console.log(r.detailed_recipe);
  }
}
checkSpecifics();
