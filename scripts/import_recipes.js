// ============================================================
// Epicurean AI — Recipe Database Import Script (v3 - Fixed)
// Deduplicates within the dataset, inserts row-by-row safely
// Run: node scripts/import_recipes.js
// ============================================================

import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const toBool = (v) => ['yes','true','1'].includes(String(v ?? '').toLowerCase().trim());
const toInt  = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };
const toStr  = (v) => (v == null ? null : String(v).trim() || null);

console.log('📖  Reading world_dishes_database.xlsx...');
const wb = xlsx.readFile(join(__dirname, '..', 'world_dishes_database.xlsx'));
const raw = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
console.log(`✅  Found ${raw.length} rows in Excel`);

// Map + deduplicate by dish_name (keep last occurrence)
const seen = new Map();
for (const row of raw) {
  const name = toStr(row['dish_name']);
  if (!name) continue;
  seen.set(name, {
    dish_name:          name,
    alt_names:          toStr(row['alt_names']),
    country:            toStr(row['country']),
    region:             toStr(row['region']),
    cuisine:            toStr(row['cuisine']),
    course:             toStr(row['course']),
    dish_type:          toStr(row['dish_type']),
    key_ingredients:    toStr(row['key_ingredients']),
    full_ingredients:   toStr(row['full_ingredients']),
    method_summary:     toStr(row['method_summary']),
    detailed_recipe:    toStr(row['detailed_recipe']),
    prep_time_min:      toInt(row['prep_time_min']),
    cook_time_min:      toInt(row['cook_time_min']),
    total_time_min:     toInt(row['total_time_min']),
    servings:           toInt(row['servings']),
    difficulty:         toStr(row['difficulty']),
    spice_level:        toInt(row['spice_level']),
    is_vegetarian:      toBool(row['is_vegetarian']),
    is_vegan:           toBool(row['is_vegan']),
    is_gluten_free:     toBool(row['is_gluten_free']),
    contains_dairy:     toBool(row['contains_dairy']),
    contains_nuts:      toBool(row['contains_nuts']),
    description:        toStr(row['description']),
    image_url:          toStr(row['image_url']),
    wikipedia_url:      toStr(row['wikipedia_url']),
    image_search_query: toStr(row['image_search_query']),
  });
}

const recipes = Array.from(seen.values());
console.log(`🗂️   Unique recipes after dedup: ${recipes.length}\n`);

// Batch upsert — safe even if some already exist
const BATCH = 100;
let done = 0; let failed = 0;

for (let i = 0; i < recipes.length; i += BATCH) {
  const batch = recipes.slice(i, i + BATCH);
  const { error } = await supabase
    .from('recipes')
    .upsert(batch, { onConflict: 'dish_name', ignoreDuplicates: true });

  if (error) {
    if (error.message?.includes('row-level security')) {
      console.error('\n❌  RLS still enabled! Run in Supabase SQL Editor:');
      console.error('   ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;\n');
      process.exit(1);
    }
    console.error(`\n⚠️  Batch ${i}–${i+BATCH}: ${error.message}`);
    failed += batch.length;
  } else {
    done += batch.length;
  }

  const pct = Math.round(((i + BATCH) / recipes.length) * 100);
  process.stdout.write(`\r⬆️   ${Math.min(i+BATCH, recipes.length)}/${recipes.length} (${Math.min(pct,100)}%)  `);
}

console.log(`\n\n✅  Done! Upserted: ${done} | Failed: ${failed}`);
console.log('\n🔒  Now re-enable RLS in Supabase SQL Editor:');
console.log('    ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;');
