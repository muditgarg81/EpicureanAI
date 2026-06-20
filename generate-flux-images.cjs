require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const fluxKey = process.env.VITE_FLUX_API_KEY;
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BATCH_SIZE = 2;

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

async function generateFluxImage(prompt) {
  console.log("Requesting Flux API...");
  const res = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'x-key': fluxKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      width: 1024,
      height: 768,
      prompt_upsampling: false,
      seed: 42,
      safety_tolerance: 2,
      output_format: "jpeg"
    })
  });

  const data = await res.json();
  if (!data.id) {
    throw new Error(`Failed to start generation: ${JSON.stringify(data)}`);
  }

  const taskId = data.id;
  console.log(`Task started: ${taskId}. Polling for result...`);

  let maxAttempts = 30;
  while (maxAttempts > 0) {
    await sleep(2000); // Poll every 2s
    const pollRes = await fetch(`https://api.bfl.ai/v1/get_result?id=${taskId}`, {
      headers: { 'x-key': fluxKey }
    });
    const pollData = await pollRes.json();

    if (pollData.status === 'Ready') {
      return pollData.result.sample; // URL of the generated image
    } else if (pollData.status === 'Failed' || pollData.status === 'Error') {
      throw new Error(`Generation failed: ${JSON.stringify(pollData)}`);
    }
    
    process.stdout.write('.');
    maxAttempts--;
  }

  throw new Error("Timed out waiting for Flux API");
}

async function run() {
  console.log(`Starting Flux generation for ${BATCH_SIZE} dishes...`);
  
  // Fetch all existing images
  const { data: existingImages } = await supabase.from('dish_images').select('dish_name');
  const existingSet = new Set(existingImages.map(img => img.dish_name.toLowerCase()));

  // Fetch all recipes
  const { data: allDishes, error } = await supabase.from('recipes').select('id, dish_name, country, detailed_recipe');
  if (error) {
    console.error("Error fetching dishes:", error);
    return;
  }

  // Filter out those that already have images
  const dishes = allDishes.filter(d => !existingSet.has(d.dish_name.toLowerCase())).slice(0, BATCH_SIZE);


  for (const dish of dishes) {
    console.log(`\n--- Processing: ${dish.dish_name} ---`);
    
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

    try {
      const imageUrl = await generateFluxImage(prompt);
      console.log("\nGenerated Image URL:", imageUrl);

      console.log("Downloading image...");
      const imgRes = await fetch(imageUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const safeFilename = `${dish.dish_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4()}.jpg`;
      
      console.log(`Uploading to Supabase Storage as ${safeFilename}...`);
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
          image_attribution: 'AI Generated (Flux Pro 1.1)',
          image_prompt: prompt,
          image_verified: true
        });

      if (dbError) {
        console.error("Database insert error:", dbError);
      } else {
        console.log(`✅ Successfully saved ${dish.dish_name}`);
      }

    } catch (e) {
      console.error(`\nFailed to process ${dish.dish_name}:`, e.message);
    }
  }
  
  console.log("\nBatch complete.");
}

run();
