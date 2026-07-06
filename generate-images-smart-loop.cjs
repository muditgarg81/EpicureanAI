require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const sharp = require('sharp');

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const FLUX_API_KEY = process.env.VITE_FLUX_API_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const BATCH_SIZE = 50;
let activeProvider = 'gemini'; // 'gemini', 'flux', 'openai'

function buildPrompt(dishName, country, recipeText) {
  let ingredients = "";
  if (recipeText && recipeText.length > 10) {
    ingredients = recipeText.substring(0, 150) + "...";
  }
  return `Professional food photography of ${dishName}, ${country || 'global'} cuisine. Key details: ${ingredients}. Authentic traditional presentation. Shot from 45-degree angle, on appropriate traditional serving ware, soft natural window light, shallow depth of field, warm inviting tones, restaurant-quality. Food magazine editorial style.`;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateGeminiImage(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: { sampleCount: 1, outputOptions: { mimeType: "image/jpeg" } }
    })
  });
  
  if (res.status === 429) throw new Error("429_RATE_LIMIT");

  const data = await res.json();
  if (data.predictions && data.predictions.length > 0) {
    return Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
  } else {
    throw new Error(`Gemini Generation failed: ${JSON.stringify(data)}`);
  }
}

async function generateFluxImage(prompt) {
  const res = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'x-key': FLUX_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ prompt, width: 1024, height: 768, prompt_upsampling: false, seed: 42, safety_tolerance: 2, output_format: "jpeg" })
  });

  const data = await res.json();
  if (!data.id) {
     if (data.detail && data.detail === "Insufficient credits") throw new Error("INSUFFICIENT_CREDITS");
     throw new Error(`Failed to start Flux: ${JSON.stringify(data)}`);
  }

  const taskId = data.id;
  let maxAttempts = 30;
  while (maxAttempts > 0) {
    await sleep(2000);
    const pollRes = await fetch(`https://api.bfl.ai/v1/get_result?id=${taskId}`, { headers: { 'x-key': FLUX_API_KEY } });
    const pollData = await pollRes.json();

    if (pollData.status === 'Ready') {
      const imgRes = await fetch(pollData.result.sample);
      const arrayBuffer = await imgRes.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else if (pollData.status === 'Failed' || pollData.status === 'Error') {
      throw new Error(`Flux failed: ${JSON.stringify(pollData)}`);
    }
    maxAttempts--;
  }
  throw new Error("Timed out waiting for Flux API");
}

async function generateOpenAIImage(prompt) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024"
  });
  
  const imageUrl = response.data[0].url;
  const imgRes = await fetch(imageUrl);
  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

const PRIORITY_KEYWORDS = [
  "grilled cheese", "caesar salad", "cacio e pepe", "steak frites", "omelette", "scrambled eggs",
  "salmon", "eggs benedict", "avocado toast", "teriyaki salmon", "peking duck", "mapo tofu", 
  "boeuf bourguignon", "ceviche", "enchiladas", "bibimbap", "pho", "paella", "fish and chips",
  "poutine", "moussaka", "lasagna", "pasta carbonara", "pizza", "tacos", "ramen", "pad thai", 
  "coq au vin", "shakshuka", "burger", "sushi", "tikka masala", "misal pav", "puran poli", 
  "paneer butter masala", "dal makhani", "pav bhaji", "vada pav", "dal tadka", "gulab jamun", 
  "biryani", "risotto", "idli", "masala dosa", "chicken chettinad", "meen moilee", "mysore pak", 
  "sambar", "rasam", "avial", "puttu", "ven pongal", "medhu vada", "vegetarian", "spicy", "chicken", "pasta", "salad", "soup"
];

function getPriorityScore(dishName) {
  if (!dishName) return 0;
  const lowerName = dishName.toLowerCase();
  for (const kw of PRIORITY_KEYWORDS) {
    if (lowerName.includes(kw)) return 1;
  }
  return 0;
}

async function run() {
  console.log(`Starting highly resilient smart generation with multi-provider fallback...`);
  
  while (true) {
    const { data: existingImages, error: imgError } = await supabase.from('dish_images').select('dish_name');
    if (imgError || !existingImages) {
      console.error("Error fetching existing images:", imgError);
      await sleep(5000);
      continue;
    }
    const existingSet = new Set(existingImages.map(img => img.dish_name.toLowerCase()));

    const { data: allDishes, error } = await supabase.from('recipes').select('id, dish_name, country, detailed_recipe');
    if (error || !allDishes) break;

    const unCached = allDishes.filter(d => !existingSet.has(d.dish_name.toLowerCase()));
    unCached.sort((a, b) => getPriorityScore(b.dish_name) - getPriorityScore(a.dish_name));
    const dishes = unCached.slice(0, BATCH_SIZE);

    if (dishes.length === 0) {
      console.log("No more un-cached dishes found! Overhaul complete.");
      break;
    }

    console.log(`Processing next batch of ${dishes.length} dishes using ${activeProvider}...`);

    for (const dish of dishes) {
      console.log(`\n--- Processing: ${dish.dish_name} ---`);
      const prompt = buildPrompt(dish.dish_name, dish.country, dish.detailed_recipe);

      let buffer;
      let attribution;

      try {
        if (activeProvider === 'gemini') {
          buffer = await generateGeminiImage(prompt);
          attribution = 'AI Generated (Imagen 4 Fast)';
        } else if (activeProvider === 'flux') {
          buffer = await generateFluxImage(prompt);
          attribution = 'AI Generated (Flux Pro 1.1)';
        } else if (activeProvider === 'openai') {
          buffer = await generateOpenAIImage(prompt);
          attribution = 'AI Generated (DALL-E 3)';
        }
      } catch (e) {
        if (e.message === "429_RATE_LIMIT" && activeProvider === 'gemini') {
          console.log("⚠️ Gemini quota exhausted! Failing over to Flux API...");
          activeProvider = 'flux';
        } else if (activeProvider === 'gemini') {
          console.error(`Gemini generation failed: ${e.message}. Failing over to Flux...`);
          activeProvider = 'flux';
        }
        
        if (activeProvider === 'flux') {
           try {
             buffer = await generateFluxImage(prompt);
             attribution = 'AI Generated (Flux Pro 1.1)';
           } catch(err) {
             if (err.message === "INSUFFICIENT_CREDITS") {
                console.log("⚠️ Flux credits exhausted! Failing over to OpenAI DALL-E 3...");
                activeProvider = 'openai';
             } else {
                console.error("Flux fallback failed:", err.message);
                continue;
             }
           }
        }
        
        if (activeProvider === 'openai' && !buffer) {
           try {
              buffer = await generateOpenAIImage(prompt);
              attribution = 'AI Generated (DALL-E 3)';
           } catch(err) {
              console.error("OpenAI fallback failed:", err.message);
              continue;
           }
        }
      }

      if (!buffer) continue;

      try {
        console.log(`Compressing image for ${dish.dish_name}...`);
        buffer = await sharp(buffer)
          .resize({ width: 512, height: 512, fit: 'inside' })
          .webp({ quality: 80 })
          .toBuffer();
      } catch (err) {
        console.error("Compression failed:", err.message);
        continue;
      }

      try {
        const safeFilename = `${dish.dish_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('dish-images')
          .upload(safeFilename, buffer, { contentType: 'image/webp', upsert: true });

        if (uploadError) continue;

        const { data: publicUrlData } = supabase.storage.from('dish-images').getPublicUrl(safeFilename);
        const publicUrl = publicUrlData.publicUrl;

        await supabase.from('dish_images').insert({
          dish_name: dish.dish_name.toLowerCase(),
          image_url: publicUrl,
          source: 'ai_generated',
          image_id: safeFilename,
          image_attribution: attribution,
          image_prompt: prompt,
          image_verified: true
        });

        await supabase.from('recipes').update({ image_url: publicUrl }).eq('id', dish.id);

        console.log(`✅ Saved ${dish.dish_name} (${attribution})`);
        
        // Wait differently based on provider rate limits
        if (activeProvider === 'gemini') await sleep(7000);
        else if (activeProvider === 'flux') await sleep(2000);
        else await sleep(1500);

      } catch (e) {
        console.error(`\nFailed to upload/save ${dish.dish_name}:`, e.message);
        await sleep(5000);
      }
    }
  }
}

run();
