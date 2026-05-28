import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: recipes, error: rError } = await supabase
    .from('recipes')
    .select('id, dish_name, image_url')
    .ilike('dish_name', '%lachha paratha%');

  console.log('Recipes Table:', recipes || rError);

  const { data: images, error: iError } = await supabase
    .from('dish_images')
    .select('*')
    .ilike('dish_name', '%lachha paratha%');

  console.log('Dish Images Table:', images || iError);
}

run();
