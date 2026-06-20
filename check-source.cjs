const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { count: aiCount } = await supabase.from('dish_images').select('*', { count: 'exact', head: true }).eq('source', 'ai_generated');
  const { count: wikiCount } = await supabase.from('dish_images').select('*', { count: 'exact', head: true }).neq('source', 'ai_generated');
  console.log("AI Images:", aiCount);
  console.log("Other Images:", wikiCount);
}
check();
