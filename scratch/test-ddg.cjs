const { image_search } = require('duckduckgo-images-api');

async function run() {
  console.log("Searching DDG...");
  try {
    const results = await image_search({ query: 'Banitsa food', moderate: true, iterations: 1 });
    console.log("Results length:", results.length);
    console.log("Top 3:", results.slice(0, 3));
  } catch(e) {
    console.error(e);
  }
}
run();
