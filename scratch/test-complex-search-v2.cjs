const SPOONACULAR_KEY = '6c49bf8ad8c34251a31e57a6982ccfec';

async function testComplexSearch() {
  try {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_KEY,
      query: 'pasta',
      number: '1',
      addRecipeInformation: 'true',
      fillIngredients: 'true',
    });
    console.log("Fetching Spoonacular complexSearch with addRecipeInformation and fillIngredients...");
    const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
    const json = await res.json();
    if (json.results && json.results.length > 0) {
      const r = json.results[0];
      console.log("Keys:", Object.keys(r));
      console.log("vegan:", r.vegan);
      console.log("vegetarian:", r.vegetarian);
      console.log("glutenFree:", r.glutenFree);
      console.log("dairyFree:", r.dairyFree);
      console.log("extendedIngredients present:", !!r.extendedIngredients);
      if (r.extendedIngredients) {
        console.log("Ingredients count:", r.extendedIngredients.length);
        console.log("First ingredient details:", JSON.stringify(r.extendedIngredients[0], null, 2));
      }
    } else {
      console.log("No results:", json);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testComplexSearch();
