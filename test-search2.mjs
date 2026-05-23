import fs from 'fs';
import { pathToFileURL } from 'url';

const env = fs.readFileSync('.env.local', 'utf-8');
const lines = env.split('\n');
for (const line of lines) {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts.shift().trim();
    const v = parts.join('=').trim().replace(/['"]/g, '');
    if (k && v) process.env[k] = v;
  }
}

import { createClient } from '@supabase/supabase-js';
global.supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  try {
    const moduleUrl = pathToFileURL('./src/services/unifiedSearchService.js').href;
    // We need to bypass the local imports issue. The easiest way is to mock it or compile it.
    // Let's just write a test script that directly calls externalRecipeService!
    const extUrl = pathToFileURL('./src/services/externalRecipeService.js').href;
    const ext = await import(extUrl);
    
    console.log('Testing fetchRecipesByIngredients...');
    const res = await ext.fetchRecipesByIngredients(['banana', 'pudding']);
    console.log('Got', res.length, 'recipes:', res.map(r => r.title));
  } catch (err) {
    console.error(err);
  }
})();
