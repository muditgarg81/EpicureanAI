require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { error: delError } = await supabase.from('dish_images').delete().eq('dish_name', 'dal tadka');
  console.log('Delete Dal Tadka:', delError || 'Success');
  
  if (!delError) {
    const { error: insError } = await supabase.from('dish_images').insert({
      dish_name: 'dal tadka',
      image_url: 'https://images.unsplash.com/photo-1626500155537-93690c24099e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NTg5Mjd8MHwxfHNlYXJjaHwxfHxEYWwlMjBUYWRrYSUyMGZvb2R8ZW58MHwwfHx8MTc4MDgwMzc0Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      source: 'unsplash',
      image_verified: true
    });
    console.log('Insert Dal Tadka:', insError || 'Success');
  }
}
run();
