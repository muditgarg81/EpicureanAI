import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const genericIds = [
  'photo-1504674900247-0877df9cc836', 'photo-1540189549336-e6e99c3679fe',
  'photo-1498837167922-ddd27525d352', 'photo-1493770348161-369560ae357d',
  'photo-1565299624946-b28f40a0ae38', 'photo-1484723091739-30a097e8f929',
  'photo-1482049016688-2d3e1b311543', 'photo-1512621776951-a57141f2eefd',
  'photo-1473093295043-cdd812d0e601', 'photo-1476224203421-9ac39bcb3327',
  '1604908176997-125f25cc6f3d', 'loremflickr.com'
];

const cleanup = async () => {
  console.log('Fetching poisoned dish_images...');
  const { data, error } = await supabase.from('dish_images').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  const poisoned = data.filter(row => genericIds.some(id => row.image_url.includes(id)));
  console.log(`Found ${poisoned.length} poisoned images in Supabase.`);
  
  for (let row of poisoned) {
    console.log(`Deleting poisoned image for: ${row.dish_name}`);
    await supabase.from('dish_images').delete().eq('id', row.id);
  }
  console.log('Cleanup complete.');
};

cleanup();
