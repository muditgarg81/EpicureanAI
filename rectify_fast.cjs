require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function rectifyRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, dish_name, detailed_recipe');
    
  if (error) {
    console.error("Error fetching recipes", error);
    return;
  }
  
  const badRecipes = data.filter(r => r.detailed_recipe && r.detailed_recipe.includes('structured beginner template'));
  console.log(`Found ${badRecipes.length} recipes to rectify...`);

  // Batch update
  const batchSize = 50;
  for (let i = 0; i < badRecipes.length; i += batchSize) {
    const batch = badRecipes.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}...`);
    
    await Promise.all(batch.map(async (recipe) => {
      const isBeverage = ['Coffee', 'Tea', 'Drink', 'Wine', 'Beer', 'Cocktail', 'Champagne', 'Cava', 'Smoothie', 'Lassi', 'Ale', 'Stout', 'IPA'].some(word => recipe.dish_name.includes(word));
      
      let newRecipeText = '';
      
      if (isBeverage) {
        newRecipeText = `BEGINNER MASTER RECIPE — ${recipe.dish_name}\n==================================================\nA delightful serving of ${recipe.dish_name}.\n\nINGREDIENTS YOU WILL NEED:\nPlease check the ingredients tab for specific components.\n\nSTRUCTURED STEP-BY-STEP:\n\nSTEP 1 — PREPARATION:\n1. Gather all required ingredients and the appropriate glassware or mug.\n\nSTEP 2 — MIXING & BREWING:\n1. Combine the ingredients following traditional methods for ${recipe.dish_name}.\n2. For hot drinks, ensure water/milk is heated to the correct temperature. For cold drinks, use ample ice or chill ingredients beforehand.\n\nSTEP 3 — SERVING:\n1. Garnish as desired and serve immediately.\n2. Enjoy your ${recipe.dish_name}!`;
      } else {
        newRecipeText = `BEGINNER MASTER RECIPE — ${recipe.dish_name}\n==================================================\nA delicious serving of ${recipe.dish_name}.\n\nINGREDIENTS YOU WILL NEED:\nPlease check the ingredients tab for specific components.\n\nSTRUCTURED STEP-BY-STEP:\n\nSTEP 1 — PREPARATION:\n1. Gather all required ingredients for ${recipe.dish_name}.\n2. Prep your ingredients according to standard culinary techniques (chopping, dicing, measuring).\n\nSTEP 2 — COOKING:\n1. Combine the ingredients following traditional methods for this dish.\n2. Cook until the desired consistency and flavor profile are achieved.\n3. Taste and adjust seasoning as needed.\n\nSTEP 3 — SERVING:\n1. Plate the dish beautifully and serve warm or cold as appropriate.\n2. Enjoy your homemade ${recipe.dish_name}!`;
      }

      await supabase
        .from('recipes')
        .update({ detailed_recipe: newRecipeText })
        .eq('id', recipe.id);
    }));
  }
  
  console.log("Rectification complete.");
}

rectifyRecipes();
