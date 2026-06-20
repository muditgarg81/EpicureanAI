require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch'); // Native fetch in Node 18+ also works, but node-fetch handles arrayBuffers nicely sometimes

const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BATCH_SIZE = 5; // Start with a small test batch!

function buildPrompt(dishName, country, recipeText) {
  let ingredients = "";
  if (recipeText && recipeText.length > 10) {
    // Basic extraction of top lines or just use it as context if short
    ingredients = recipeText.substring(0, 150) + "...";
  }
  
  return `Professional food photography of ${dishName}, ${country || 'global'} cuisine. 
  Key details: ${ingredients}. 
  Authentic traditional presentation. Shot from 45-degree angle, 
  on appropriate traditional serving ware, soft natural window light, 
  shallow depth of field, warm inviting tones, restaurant-quality. 
  Food magazine editorial style.`;
}

async function run() {
  console.log(`Starting generation for ${BATCH_SIZE} dishes...`);
  
  // 1. Fetch dishes that don't have an AI image yet
  const { data: dishes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, country, detailed_recipe')
    // We want to avoid regenerating images we already have. 
    // Since we are running a test, let's just pick 5 random dishes.
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Error fetching dishes:", error);
    return;
  }

  console.log(`Found ${dishes.length} dishes to process.`);

  for (const dish of dishes) {
    console.log(`\n--- Processing: ${dish.dish_name} ---`);
    
    // Check if it already exists in dish_images
    const { data: existing } = await supabase
      .from('dish_images')
      .select('id')
      .eq('dish_name', dish.dish_name.toLowerCase())
      .limit(1);
      
    if (existing && existing.length > 0) {
      console.log(`Image already exists for ${dish.dish_name}, skipping...`);
      continue;
    }

    const prompt = buildPrompt(dish.dish_name, dish.country, dish.detailed_recipe);
    console.log(`Prompt: ${prompt.substring(0, 80)}...`);

    try {
      // 2. Generate with DALL-E 3
      console.log("Calling OpenAI API...");
      const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      });

      const imageUrl = response.data[0].url;
      console.log("Generated Image URL:", imageUrl);

      // 3. Download image
      console.log("Downloading image...");
      const imgRes = await fetch(imageUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 4. Upload to Supabase Storage
      const filename = `${dish.dish_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4()}.webp`; // Saving as webp format name, though technically dall-e is png/jpg. Let's just use .png for safety.
      const safeFilename = filename.replace('.webp', '.png');
      
      console.log(`Uploading to Supabase Storage as ${safeFilename}...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(safeFilename, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('dish-images').getPublicUrl(safeFilename);
      const publicUrl = publicUrlData.publicUrl;
      console.log("Public URL:", publicUrl);

      // 5. Save to database
      const { error: dbError } = await supabase
        .from('dish_images')
        .insert({
          dish_name: dish.dish_name.toLowerCase(),
          image_url: publicUrl,
          source: 'ai_generated',
          image_id: safeFilename,
          image_attribution: 'AI Generated (DALL-E 3)',
          image_prompt: prompt,
          image_verified: true
        });

      if (dbError) {
        console.error("Database insert error:", dbError);
      } else {
        console.log(`✅ Successfully saved ${dish.dish_name}`);
      }

    } catch (e) {
      console.error(`Failed to process ${dish.dish_name}:`, e.message);
    }
  }
  
  console.log("\nBatch complete.");
}

run();
