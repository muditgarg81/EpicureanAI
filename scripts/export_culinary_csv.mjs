import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(__dirname, '../src/data/culinaryData.js'), 'utf8');

// Strip all export keywords and the getDishImage function at the end
const cleaned = src
  .replace(/export const /g, 'const ')
  .replace(/const getDishImage[\s\S]*$/, '');

const fn = new Function(`${cleaned}; return culinaryDataBank;`);
const culinaryDataBank = fn();

const entries = Object.entries(culinaryDataBank);
console.log(`Found ${entries.length} dishes`);

const esc = (val) => {
  const str = Array.isArray(val) ? val.join(' | ') : String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
};

const headers = ['key','title','description','time','calories','tags','ingredients','steps'];
const rows = [headers.join(',')];
for (const [key, dish] of entries) {
  rows.push([esc(key),esc(dish.title),esc(dish.description),esc(dish.time),esc(dish.calories),esc(dish.tags),esc(dish.ingredients),esc(dish.steps)].join(','));
}

const outPath = path.join(__dirname, '../culinary_database_export.csv');
writeFileSync(outPath, rows.join('\n'), 'utf8');
console.log(`✅ Exported ${entries.length} dishes → culinary_database_export.csv`);
