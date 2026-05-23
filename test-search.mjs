import fs from 'fs';
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

import { getUnifiedFullSearch } from './src/services/unifiedSearchService.js';

console.log('Testing unified search for Banana Pudding...');

getUnifiedFullSearch('Banana Pudding', { ingredients: ['banana', 'pudding'], dietary: {}, maxTime: null })
  .then(res => {
    console.log('Got results:', res.length);
    console.log(res.map(r => r.dish_name));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
