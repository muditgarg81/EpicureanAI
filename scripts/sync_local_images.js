import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

const artifactDir = 'C:\\Users\\MUDIT GARG\\.gemini\\antigravity\\brain\\90fdf123-5f2d-4a49-bc5f-4e4fa51921ef';
const publicAiDir = path.join(process.cwd(), 'public', 'images', 'ai');

if (!fs.existsSync(publicAiDir)) {
  fs.mkdirSync(publicAiDir, { recursive: true });
}

async function syncImages() {
  console.log("🔄 Starting Image Sync Process...");
  
  const files = fs.readdirSync(artifactDir).filter(f => f.endsWith('.png'));
  console.log(`Found ${files.length} images in local artifact directory.`);

  for (const file of files) {
    if (file.startsWith('media__')) continue; // Skip generic names from early batches unless we know what they are

    // Parse dish name from file (e.g., "sopa_de_lima_1781368958119.png" -> "sopa de lima")
    const namePart = file.replace(/_\d+\.png$/, '').replace(/_/g, ' ');
    
    // Query Supabase
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, dish_name, image_url')
      .ilike('dish_name', `%${namePart}%`)
      .limit(1);

    if (error || !recipes || recipes.length === 0) {
      console.log(`⚠️ Could not find database match for: ${namePart}`);
      continue;
    }

    const recipe = recipes[0];
    
    // Skip if it already points to our local AI folder
    if (recipe.image_url && recipe.image_url.startsWith('/images/ai/')) {
      continue;
    }

    const newFilename = `${recipe.id}_${file.replace(/_\d+\.png$/, '')}.png`;
    const destPath = path.join(publicAiDir, newFilename);
    const srcPath = path.join(artifactDir, file);
    
    // Copy file to public folder
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file} to public/images/ai/${newFilename}`);

    // Update database
    const publicUrl = `/images/ai/${newFilename}`;
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ image_url: publicUrl })
      .eq('id', recipe.id);

    if (updateError) {
      console.error(`❌ DB Update failed for ${recipe.dish_name}:`, updateError.message);
    } else {
      console.log(`💾 Synced ${recipe.dish_name} to database -> ${publicUrl}`);
    }
  }
  
  console.log("🎉 Sync Complete!");
}

syncImages();
