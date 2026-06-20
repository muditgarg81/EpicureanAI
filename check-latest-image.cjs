const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('dish_images')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log("Latest image:", data);
}

check();
