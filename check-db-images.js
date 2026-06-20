import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  const { data, error } = await supabase
    .from('dish_images')
    .select('*')
    .in('dish_name', ['tortilla (corn)', 'ciorbă de burtă', 'memoni biryani', 'tortilla', 'ciorba de burta']);

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Images in DB:', data);
  }
}

checkDB();
