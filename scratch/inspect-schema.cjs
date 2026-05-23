const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Query metadata/RPC or insert a test item and inspect it
  // Actually, we can check table structure by running a query on a non-existent ID or simply checking the API description
  // Let's query information_schema if possible, or just see if there's any record in pantry_items for any user
  const { data: cols, error: err } = await supabase
    .from('pantry_items')
    .select('*')
    .limit(1);

  if (err) {
    console.error('Error fetching columns:', err);
  } else {
    console.log('Columns in pantry_items table (from sample row or empty array keys):', cols);
  }
}

run();
