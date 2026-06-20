import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

// ⚠️ IMPORTANT: We must use the SERVICE ROLE KEY, not the anon key!
// The anon key does not have permission to upload files to storage or bypass RLS.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseKey) {
  console.error("❌ ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("Please add your Service Role Key (from Supabase Dashboard -> Settings -> API) to .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateImage(recipe) {
  console.log(`\n🎨 Generating image for: ${recipe.dish_name}...`);
  
  const prompt = `A stunning, high-resolution, photorealistic, premium food photography shot of ${recipe.dish_name}. ${recipe.description || ''}. Warm, dramatic lighting.`;

  // Using OpenAI DALL-E 3 as the standardized provider
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].url; // Temporary URL from OpenAI
}

async function uploadToSupabase(imageUrl, recipeId, dishName) {
  console.log(`☁️ Uploading to Supabase Storage...`);
  
  // Download the image from OpenAI
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const sanitizedName = dishName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${recipeId}_${sanitizedName}.png`;

  // Upload to the 'recipe-images' bucket
  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(filename, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) throw new Error(`Supabase Upload Error: ${error.message}`);

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

async function run() {
  console.log("🔍 Fetching recipes missing images...");
  
  // Find recipes where image_url is null or empty
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, description')
    .or('image_url.is.null,image_url.eq.')
    .limit(10); // Process in batches of 10 to avoid rate limits

  if (error) {
    console.error("❌ Database Error:", error.message);
    return;
  }

  if (recipes.length === 0) {
    console.log("✅ All recipes have images!");
    return;
  }

  console.log(`Found ${recipes.length} recipes in this batch.`);

  for (const recipe of recipes) {
    try {
      // 1. Generate Image
      const temporaryImageUrl = await generateImage(recipe);
      
      // 2. Upload to Supabase
      const permanentUrl = await uploadToSupabase(temporaryImageUrl, recipe.id, recipe.dish_name);
      
      // 3. Update Database
      console.log(`💾 Updating database with new URL...`);
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: permanentUrl })
        .eq('id', recipe.id);

      if (updateError) throw new Error(`Database Update Error: ${updateError.message}`);
      
      console.log(`✅ Success: ${recipe.dish_name}`);
      
      // Sleep for 2 seconds to respect API rate limits
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (err) {
      console.error(`❌ Failed processing ${recipe.dish_name}:`, err.message);
    }
  }
  
  console.log("\n🎉 Batch complete! Run the script again to process the next batch.");
}

run();
