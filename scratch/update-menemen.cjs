const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateMenemen() {
  const targetUrl = 'https://en.wikipedia.org/wiki/Menemen_(food)#/media/File:My_breakfast_menemen.jpg';
  
  // First, find the recipe
  const { data, error } = await supabase
    .from('recipes')
    .select('id, dish_name, image_url')
    .ilike('dish_name', '%menemen%');
    
  if (error) {
    console.error('Error finding recipe:', error);
    return;
  }
  
  console.log('Found recipes:', data);
  
  if (data && data.length > 0) {
    for (const recipe of data) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: targetUrl })
        .eq('id', recipe.id);
        
      if (updateError) {
        console.error('Error updating recipe', recipe.id, updateError);
      } else {
        console.log(`Successfully updated ${recipe.dish_name} with image: ${targetUrl}`);
      }
    }
  } else {
    console.log('No recipes found matching "menemen"');
  }
}

updateMenemen();
