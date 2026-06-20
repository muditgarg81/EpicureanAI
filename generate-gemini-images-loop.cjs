require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BATCH_SIZE = 50;

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

async function generateImagen(prompt) {
  let retries = 3;
  while (retries > 0) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1, outputOptions: { mimeType: "image/jpeg" } }
      })
    });
    
    if (res.status === 429) {
      console.log("Rate limited (429)! Sleeping for 60 seconds...");
      await sleep(60000);
      retries--;
      continue;
    }

    const data = await res.json();
    if (data.predictions && data.predictions.length > 0) {
      return data.predictions[0].bytesBase64Encoded;
    } else {
      throw new Error(`Generation failed: ${JSON.stringify(data)}`);
    }
  }
  throw new Error("Max retries reached for 429 Rate Limit");
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
  console.log(`Starting continuous Imagen 4 generation with Discover priority...`);
  
  while (true) {
    const { data: existingImages, error: imgError } = await supabase.from('dish_images').select('dish_name');
    if (imgError || !existingImages) {
      console.error("Error fetching existing images:", imgError);
      await sleep(5000);
      continue;
    }
    const existingSet = new Set(existingImages.map(img => img.dish_name.toLowerCase()));

    const { data: allDishes, error } = await supabase.from('recipes').select('id, dish_name, country, detailed_recipe');
    if (error || !allDishes) {
      console.error("Error fetching dishes:", error);
      break;
    }

    const unCached = allDishes.filter(d => !existingSet.has(d.dish_name.toLowerCase()));
    
    // Sort so priority dishes come first
    unCached.sort((a, b) => getPriorityScore(b.dish_name) - getPriorityScore(a.dish_name));

    const dishes = unCached.slice(0, BATCH_SIZE);

    if (dishes.length === 0) {
      console.log("No more un-cached dishes found! Overhaul complete.");
      break;
    }

    console.log(`Processing next batch of ${dishes.length} dishes...`);

    for (const dish of dishes) {
      console.log(`\n--- Processing: ${dish.dish_name} ---`);
      const prompt = buildPrompt(dish.dish_name, dish.country, dish.detailed_recipe);

      try {
        const base64Data = await generateImagen(prompt);
        const buffer = Buffer.from(base64Data, 'base64');
        const safeFilename = `${dish.dish_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('dish-images')
          .upload(safeFilename, buffer, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from('dish-images').getPublicUrl(safeFilename);
        const publicUrl = publicUrlData.publicUrl;

        const { error: dbError } = await supabase
          .from('dish_images')
          .insert({
            dish_name: dish.dish_name.toLowerCase(),
            image_url: publicUrl,
            source: 'ai_generated',
            image_id: safeFilename,
            image_attribution: 'AI Generated (Imagen 4 Fast)',
            image_prompt: prompt,
            image_verified: true
          });

        // Update the main recipes table so the frontend sees it immediately!
        await supabase
          .from('recipes')
          .update({ image_url: publicUrl })
          .eq('id', dish.id);

        if (dbError) {
          console.error("Database insert error:", dbError);
        } else {
          console.log(`✅ Successfully saved ${dish.dish_name}`);
        }
        
        // Sleep 7 seconds between requests to maintain under 10 requests per minute
        await sleep(7000);

      } catch (e) {
        console.error(`\nFailed to process ${dish.dish_name}:`, e.message);
        // Sleep if we hit a generic error just in case
        await sleep(5000);
      }
    }
  }
}

run();
