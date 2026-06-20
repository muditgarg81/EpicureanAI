const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { error } = await s.from('profiles').select('name, role, masteryLevel, regionsExplored, cuisines, onboarded').limit(1);
  console.log('Profile columns check:', error || 'All exist!');
}
test();
