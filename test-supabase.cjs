const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('profiles').select('id, activePlan, dietaryRestrictions').limit(1);
  console.log('Profiles check:', error || 'Success');

  const { data: fmData, error: fmError } = await supabase.from('family_members_data').select('family_id, members').limit(1);
  console.log('Family check:', fmError || 'Success');
}
test();
