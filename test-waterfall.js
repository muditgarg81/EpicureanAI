import { getDishImageWaterfall } from './src/services/imageWaterfallService.js';
import fetch from 'node-fetch';

// Mock browser APIs
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.fetch = fetch;

async function run() {
  console.log('Testing waterfall for "Tortilla (Corn)"...');
  const url1 = await getDishImageWaterfall('Tortilla (Corn)');
  console.log('Result 1:', url1);

  console.log('Testing waterfall for "Ciorbă de Burtă"...');
  const url2 = await getDishImageWaterfall('Ciorbă de Burtă');
  console.log('Result 2:', url2);
  
  console.log('Testing waterfall for "Memoni Biryani"...');
  const url3 = await getDishImageWaterfall('Memoni Biryani');
  console.log('Result 3:', url3);
}

run();
