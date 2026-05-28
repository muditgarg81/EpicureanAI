import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exportToCSV() {
  console.log('Fetching all recipes from database...');
  let allRecipes = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching recipes:', error);
      break;
    }

    if (data.length > 0) {
      allRecipes = allRecipes.concat(data);
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allRecipes.length} recipes. Generating CSV...`);

  if (allRecipes.length === 0) return;
  const headers = Object.keys(allRecipes[0]);
  let csvContent = headers.join(',') + '\n';

  // Format rows
  allRecipes.forEach(recipe => {
    const row = headers.map(header => {
      const val = recipe[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvContent += row.join(',') + '\n';
  });

  const outputPath = 'culinary_database_export_with_images.csv';
  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`Successfully exported to ${outputPath}`);
}

exportToCSV();
