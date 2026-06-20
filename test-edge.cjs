
require('dotenv').config({ path: '.env.local' });

async function check() {
  const res = await fetch(`https://faubfxqdufvusuablqqe.supabase.co/functions/v1/generate-images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

check();
