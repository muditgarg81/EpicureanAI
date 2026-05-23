const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SPOONACULAR_KEY = '6c49bf8ad8c34251a31e57a6982ccfec';
const ingredients = ['chicken', 'cabbage'];

async function testSpoonacular() {
  try {
    const params = new URLSearchParams({
      apiKey      : SPOONACULAR_KEY,
      ingredients : ingredients.join(','),
      number      : '6',
      ranking     : '1',
      ignorePantry: 'true',
    });
    console.log("Fetching Spoonacular findByIngredients...");
    const res  = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?${params}`);
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("JSON response:", json);
  } catch (err) {
    console.error("Error fetching Spoonacular:", err);
  }
}

testSpoonacular();
