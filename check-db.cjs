require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Helper to load env vars correctly if they are in .env.local
const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
}

const url = process.env.VITE_SUPABASE_URL || 'https://faubfxqdufvusuablqqe.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);
async function run() {
  const { data } = await supabase.from('dish_images').select('*').like('dish_name', '%lassi%');
  console.log('Database records for Lassi:', data);
  
  const { data: chips } = await supabase.from('dish_images').select('*').like('dish_name', '%chips%');
  console.log('Database records for Chips:', chips);
  
  const { data: tea } = await supabase.from('dish_images').select('*').like('dish_name', '%tea%');
  console.log('Database records for Tea:', tea);
}
run();
