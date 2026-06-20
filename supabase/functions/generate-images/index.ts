import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2"
import { v4 as uuidv4 } from "https://esm.sh/uuid@10.0.0"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const BATCH_SIZE = 5

const PRIORITY_KEYWORDS = [
  'popular', 'chicken', 'beef', 'pasta', 'rice', 'pizza', 'curry', 
  'soup', 'salad', 'breakfast', 'dinner', 'cake', 'cookie',
  'taco', 'burger', 'sandwich', 'bread', 'noodles'
];

function getPriorityScore(dishName: string) {
  if (!dishName) return 0;
  const lowerName = dishName.toLowerCase();
  for (const kw of PRIORITY_KEYWORDS) {
    if (lowerName.includes(kw)) return 1;
  }
  return 0;
}

function buildPrompt(dishName: string, country: string, recipeText: string) {
  let ingredients = "";
  if (recipeText && recipeText.length > 10) {
    ingredients = recipeText.substring(0, 150) + "...";
  }
  return `Professional food photography of ${dishName}, ${country || 'global'} cuisine. Key details: ${ingredients}. Authentic traditional presentation. Shot from 45-degree angle, on appropriate traditional serving ware, soft natural window light, shallow depth of field, warm inviting tones, restaurant-quality. Food magazine editorial style.`;
}

async function generateImagen(prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: { sampleCount: 1, outputOptions: { mimeType: "image/jpeg" } }
    })
  });
  
  if (res.status === 429) {
    throw new Error('429 Rate Limit');
  }
  
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || 'Gemini API Error');
  }
  
  if (!data.predictions || data.predictions.length === 0) {
    throw new Error('No predictions returned');
  }
  
  return data.predictions[0].bytesBase64Encoded;
}

serve(async (req) => {
  try {
    console.log("Edge Function invoked: Fetching un-cached dishes");
    
    // 1. Fetch existing AI images with pagination to bypass 1000 row limit!
    let allExistingImages: any[] = [];
    let page = 0;
    while (true) {
      const { data, error } = await supabase
        .from('dish_images')
        .select('dish_name')
        .eq('source', 'ai_generated')
        .range(page * 1000, (page + 1) * 1000 - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allExistingImages = allExistingImages.concat(data);
      if (data.length < 1000) break;
      page++;
    }
    
    const existingSet = new Set(allExistingImages.map(img => img.dish_name.toLowerCase().trim()));

    // 2. Fetch dishes from recipes (also paginated if > 1000)
    let allDishes: any[] = [];
    let rPage = 0;
    while (true) {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, dish_name, country, detailed_recipe')
        .range(rPage * 1000, (rPage + 1) * 1000 - 1);
        
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allDishes = allDishes.concat(data);
      if (data.length < 1000) break;
      rPage++;
    }

    // 3. Filter un-cached and sort
    const unCached = allDishes.filter(d => {
      if (!d.dish_name) return false;
      return !existingSet.has(d.dish_name.toLowerCase().trim());
    });
    
    unCached.sort((a, b) => getPriorityScore(b.dish_name) - getPriorityScore(a.dish_name));
    const dishes = unCached.slice(0, BATCH_SIZE);

    if (dishes.length === 0) {
      return new Response(JSON.stringify({ message: "No missing images found." }), { status: 200 });
    }

    let processedCount = 0;
    let rateLimited = false;

    // 4. Process Batch
    for (const dish of dishes) {
      console.log(`Processing: ${dish.dish_name}`);
      const prompt = buildPrompt(dish.dish_name, dish.country, dish.detailed_recipe);
      
      try {
        const base64Data = await generateImagen(prompt);
        
        // Convert base64 to ArrayBuffer
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const buffer = byteArray.buffer;
        
        const safeFilename = `${dish.dish_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('dish-images')
          .upload(safeFilename, buffer, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('dish-images').getPublicUrl(safeFilename);
        const publicUrl = publicUrlData.publicUrl;

        const { error: dbUpsertError } = await supabase
          .from('dish_images')
          .upsert({
            dish_name: dish.dish_name.toLowerCase().trim(),
            image_url: publicUrl,
            source: 'ai_generated',
            image_id: safeFilename,
            image_attribution: 'AI Generated (Imagen 4 Fast)',
            image_prompt: prompt,
            image_verified: true
          }, { onConflict: 'dish_name' });

        if (dbUpsertError) throw dbUpsertError;

        await supabase
          .from('recipes')
          .update({ image_url: publicUrl })
          .eq('id', dish.id);

        console.log(`Successfully saved ${dish.dish_name}`);
        processedCount++;
        
      } catch (err: any) {
        console.error(`Failed on ${dish.dish_name}:`, err.message);
        if (err.message.includes('429 Rate Limit')) {
          console.log("Gemini API Rate Limit hit. Exiting batch gracefully.");
          rateLimited = true;
          break; // Stop processing the rest of the batch
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount, 
      rateLimited,
      message: `Processed ${processedCount} dishes. ${rateLimited ? 'Stopped early due to rate limit.' : ''}`
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Fatal function error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
