require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting bulk image compression...");

  const { data: files, error: listError } = await supabase.storage.from('dish-images').list('', { limit: 10000 });
  if (listError) {
    console.error("Error listing files:", listError);
    return;
  }

  const imagesToCompress = files.filter(f => f.name.endsWith('.jpg') || f.name.endsWith('.jpeg'));
  console.log(`Found ${imagesToCompress.length} images to compress.`);

  let successCount = 0;
  for (const file of imagesToCompress) {
    try {
      // Download
      const { data, error: downloadError } = await supabase.storage.from('dish-images').download(file.name);
      if (downloadError) {
        console.error(`Error downloading ${file.name}:`, downloadError);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      // If it's already small, skip (e.g., < 80KB)
      if (buffer.length < 80 * 1024) {
        console.log(`Skipping ${file.name} (Already small: ${(buffer.length/1024).toFixed(1)} KB)`);
        continue;
      }

      console.log(`Compressing ${file.name} (Original: ${(buffer.length/1024).toFixed(1)} KB)...`);

      const compressedBuffer = await sharp(buffer)
        .resize({ width: 512, height: 512, fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();

      // Overwrite
      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(file.name, compressedBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError);
        continue;
      }

      successCount++;
      console.log(`✅ Compressed to ${(compressedBuffer.length/1024).toFixed(1)} KB`);
      await sleep(100); // Prevent hitting rate limits
    } catch (e) {
      console.error(`Failed processing ${file.name}:`, e.message);
    }
  }

  console.log(`\nFinished! Successfully compressed ${successCount} images.`);
}

run();
