import fs from 'fs';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try to use service role key if available, otherwise anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const buf = fs.readFileSync('world_dishes_database.xlsx');
const workbook = XLSX.read(buf);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet);

console.log(`Found ${rows.length} rows in excel.`);

async function run() {
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    
    const formattedBatch = batch.map(row => {
      // Create a clean object with only the columns we want
      const cleanRow = { ...row };
      
      // Convert 'Yes'/'No' to boolean
      if (typeof cleanRow.is_vegetarian === 'string') cleanRow.is_vegetarian = cleanRow.is_vegetarian === 'Yes';
      if (typeof cleanRow.is_vegan === 'string') cleanRow.is_vegan = cleanRow.is_vegan === 'Yes';
      if (typeof cleanRow.is_gluten_free === 'string') cleanRow.is_gluten_free = cleanRow.is_gluten_free === 'Yes';
      if (typeof cleanRow.contains_dairy === 'string') cleanRow.contains_dairy = cleanRow.contains_dairy === 'Yes';
      if (typeof cleanRow.contains_nuts === 'string') cleanRow.contains_nuts = cleanRow.contains_nuts === 'Yes';
      
      // Convert comma-separated string to text array for postgres
      if (typeof cleanRow.key_ingredients === 'string') {
        cleanRow.key_ingredients = cleanRow.key_ingredients.split(',').map(s => s.trim());
      }

      // Remove id from payload so we don't accidentally update a different row's ID or insert explicit IDs
      delete cleanRow.id;

      return cleanRow;
    });

    // We can filter out duplicates from the batch itself based on dish_name to avoid unique constraints inside the same batch
    const uniqueBatchMap = new Map();
    formattedBatch.forEach(row => {
      uniqueBatchMap.set(row.dish_name, row);
    });
    const uniqueBatch = Array.from(uniqueBatchMap.values());

    const { data, error } = await supabase.from('recipes').upsert(uniqueBatch, { onConflict: 'dish_name' });
    if (error) {
      console.error("Error inserting batch:", error);
      process.exit(1);
    } else {
      console.log(`Inserted up to row ${i + batch.length}`);
    }
  }
  console.log("Database updated successfully.");
}

run();
