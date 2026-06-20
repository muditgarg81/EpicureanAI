const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('recipes').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in recipes:', Object.keys(data[0]));
  } else {
    // try inserting a dummy to see error
    const { error: e2 } = await supabase.from('recipes').insert([{}]).select('*');
    console.log('Insert error columns:', e2);
  }
}
test();
