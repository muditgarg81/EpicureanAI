const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateMenemen() {
  const targetUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/My_breakfast_menemen.jpg/1280px-My_breakfast_menemen.jpg';
  
  const { data, error } = await supabase
    .from('recipes')
    .select('id, dish_name')
    .ilike('dish_name', '%menemen%');
    
  if (error) {
    console.error('Error finding recipe:', error);
    return;
  }
  
  if (data && data.length > 0) {
    for (const recipe of data) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: targetUrl })
        .eq('id', recipe.id);
        
      if (updateError) {
        console.error('Error updating recipe', recipe.id, updateError);
      } else {
        console.log(`Successfully updated ${recipe.dish_name} with working image URL: ${targetUrl}`);
      }
    }
  }
}

updateMenemen();
