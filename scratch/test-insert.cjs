const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const item = {
    id: 'test-' + Date.now(),
    name: 'Test Spice',
    quantity: '10g',
    status: 'Optimal',
    category: 'Spices',
    level: 50,
    color: 'bg-secondary',
    user_id: '00000000-0000-0000-0000-000000000000' // dummy uuid or null
  };

  const { data, error } = await supabase
    .from('pantry_items')
    .insert([item])
    .select();

  if (error) {
    console.error('Error inserting pantry item:', error);
  } else {
    console.log('Successfully inserted item:', data);
    // clean it up
    await supabase.from('pantry_items').delete().eq('id', item.id);
  }
}

run();
