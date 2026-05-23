import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function upload() {
  const filePath = path.join(__dirname, 'join.html');
  const fileContent = fs.readFileSync(filePath);

  console.log('Uploading join.html to Supabase Storage in bucket "invites"...');
  
  const { data, error } = await supabase.storage
    .from('invites')
    .upload('join.html', fileContent, {
      contentType: 'text/html',
      upsert: true
    });

  if (error) {
    console.error('Error uploading file:', error.message || error);
    process.exit(1);
  }

  console.log('Successfully uploaded join.html!');
  console.log('Public invite URL template:', `${supabaseUrl}/storage/v1/object/public/invites/join.html?token=YOUR_TOKEN`);
}

upload();
