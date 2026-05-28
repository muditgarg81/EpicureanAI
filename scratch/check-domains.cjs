require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkUrls() {
  const { data, error } = await supabase.from('recipes').select('image_url').not('image_url', 'is', null);
  if (error) { console.error(error); return; }
  
  const domains = {};
  data.forEach(r => {
    try {
      const url = new URL(r.image_url);
      domains[url.hostname] = (domains[url.hostname] || 0) + 1;
    } catch(e) {}
  });
  console.log("Domains in DB:", domains);
}
checkUrls();
