const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { error } = await s.from('profiles').select('dietaryRestrictions').limit(1);
  console.log('dietaryRestrictions:', error || 'Exists!');
  const { error: e2 } = await s.from('profiles').select('plan_expires_at').limit(1);
  console.log('plan_expires_at:', e2 || 'Exists!');
}
test();
