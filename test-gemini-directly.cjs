
require('dotenv').config({ path: '.env.local' });

async function check() {
  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
  const prompt = "Professional food photography of Cornbread";
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: { sampleCount: 1, outputOptions: { mimeType: "image/jpeg" } }
    })
  });
  
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", JSON.stringify(data, null, 2));
}

check();
