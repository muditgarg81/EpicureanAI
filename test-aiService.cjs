require('dotenv').config({path: '.env.local'});
async function test() {
  const rawApiKey = process.env.VITE_GEMINI_API_KEY;
  const prompt = "Generate a recipe for Dal Tadka.";
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  
  for (const model of models) {
    console.log("Trying", model);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${rawApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        console.log("Error:", data);
      } else {
        console.log("Success with", model);
        break;
      }
    } catch(e) {
      console.log("Fetch failed:", e);
    }
  }
}
test();
