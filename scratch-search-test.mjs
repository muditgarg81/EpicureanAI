import { getUnifiedFullSearch } from './src/services/unifiedSearchService.js';

async function test() {
  const results = await getUnifiedFullSearch("lasagna", { ingredients: [], dietary: {} });
  console.log(`Lasagna full search returned ${results.length} results`);
}

test();
