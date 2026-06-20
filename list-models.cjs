require('dotenv').config({path: '.env.local'});
async function run() {
  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
  const data = await res.json();
  if (data.models) {
    const imagenModels = data.models.filter(m => m.name.includes('flash'));
    console.log("Image models available:", imagenModels.map(m => m.name));
  } else {
    console.log(data);
  }
}
run();
