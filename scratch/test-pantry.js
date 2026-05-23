const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPantry() {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error("Error fetching:", error);
  } else {
    console.log("Pantry items count:", data.length);
    console.log("Pantry items:", JSON.stringify(data, null, 2));
  }
}

checkPantry();
