const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('world_dishes').select('id').limit(1);
  if (!error) console.log('Table world_dishes exists!');
  else console.log('world_dishes error:', error);
  
  const { data: d2, error: e2 } = await supabase.from('recipes').select('id').limit(1);
  if (!e2) console.log('Table recipes exists!');
  else console.log('recipes error:', e2);

  const { data: d3, error: e3 } = await supabase.from('dishes').select('id').limit(1);
  if (!e3) console.log('Table dishes exists!');
  else console.log('dishes error:', e3);
}
test();
