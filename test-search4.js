import 'dotenv/config';
import { getUnifiedFullSearch } from './src/services/unifiedSearchService.js';

async function run() {
  const { results } = await getUnifiedFullSearch("vegetarian recipes", { ingredients: [], dietary: { vegetarian: true }, maxTime: null }, 1);
  const bad = results.filter(r => r.dish_name === "Tonkotsu Ramen" || r.dish_name === "Kolhapuri Mutton");
  console.log("Found bad recipes:", bad);
  console.log("Total returned:", results.length);
}
run();
