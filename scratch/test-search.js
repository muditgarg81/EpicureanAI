import { getUnifiedSuggestions } from './src/services/unifiedSearchService.js';
(async () => {
  const res = await getUnifiedSuggestions('Noodles');
  console.log('Suggestions for Noodles:', res);
})();
