require('dotenv').config({path: '.env.local'});
async function run() {
  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("No VITE_GEMINI_API_KEY found!");
    return;
  }
  
  console.log("Found VITE_GEMINI_API_KEY, testing Imagen 3...");
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: "A delicious bowl of Dal Tadka, professional food photography" }],
        parameters: { sampleCount: 1, outputOptions: { mimeType: "image/jpeg" } }
      })
    });
    const data = await res.json();
    
    if (data.predictions && data.predictions.length > 0) {
      console.log("Success! Image generated (Base64 string length):", data.predictions[0].bytesBase64Encoded.length);
    } else {
      console.log("Error or no predictions:", JSON.stringify(data, null, 2));
    }
  } catch(e) {
    console.error("Fetch failed:", e);
  }
}
run();
