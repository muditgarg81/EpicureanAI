const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('dish_images')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  console.log(`Images generated today: ${count}`);
}

check();
