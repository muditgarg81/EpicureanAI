const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { error } = await s.from('family_members_data').upsert({ family_id: 'test-id', members: [] }, { onConflict: 'family_id' });
  console.log('Upsert check:', error || 'Success');
}
test();
