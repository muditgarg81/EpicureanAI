require('dotenv').config({ path: '.env.local' });
const google = require('googlethis');
const { GoogleGenAI } = require('@google/genai');
const fetch = require('node-fetch');

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function getBase64Image(url) {
  try {
    const res = await globalThis.fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      console.log(`Skipping non-image URL: ${url} (MIME: ${mimeType})`);
      return null;
    }
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  } catch(e) {
    return null;
  }
}

async function run() {
  console.log("Searching Google Images for 'Banitsa food'...");
  const images = await google.image('Banitsa food photography', { safe: false });
  console.log("Found", images.length, "images.");
  
  // Take top 3 candidates
  const candidates = images.slice(0, 3).map(img => img.url);
  console.log("Candidates:", candidates);
  
  console.log("Downloading images for Gemini...");
  const parts = [{ text: "Which of these images is the best representation of the dish 'Banitsa' (a traditional Bulgarian pastry)? Please pick the one that looks the most delicious, has professional lighting, and clearly shows the dish without any logos, text, or people. Output ONLY the index of the image (1, 2, or 3)." }];
  
  const validCandidates = [];
  for (const url of candidates) {
    const base64Part = await getBase64Image(url);
    if (base64Part) {
      parts.push(base64Part);
      validCandidates.push(url);
    }
  }
  
  if (validCandidates.length === 0) {
    console.log("No valid images downloaded.");
    return;
  }

  console.log("Asking Gemini to pick the best image...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts
    });
    console.log("Gemini selected:", response.text);
    const index = parseInt(response.text.trim()) - 1;
    if (index >= 0 && index < validCandidates.length) {
      console.log("Winning URL:", validCandidates[index]);
    } else {
      console.log("Gemini output didn't map to a valid index.");
    }
  } catch(e) {
    console.error("Gemini error:", e.message);
  }
}
run();
