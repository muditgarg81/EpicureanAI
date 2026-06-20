const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { error } = await s.from('families').select('id, name, owner_id').limit(1);
  console.log('Families table check:', error || 'Success');
}
test();
