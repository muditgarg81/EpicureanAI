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

  for (const recipe of badRecipes) {
    const isBeverage = ['Coffee', 'Tea', 'Drink', 'Wine', 'Beer', 'Cocktail', 'Champagne', 'Cava', 'Smoothie', 'Lassi', 'Ale', 'Stout', 'IPA'].some(word => recipe.dish_name.includes(word));
    
    let newRecipeText = '';
    
    if (isBeverage) {
      newRecipeText = `BEGINNER MASTER RECIPE — ${recipe.dish_name}
==================================================
A delightful serving of ${recipe.dish_name}.

INGREDIENTS YOU WILL NEED:
Please check the ingredients tab for specific components.

STRUCTURED STEP-BY-STEP:

STEP 1 — PREPARATION:
1. Gather all required ingredients and the appropriate glassware or mug.

STEP 2 — MIXING & BREWING:
1. Combine the ingredients following traditional methods for ${recipe.dish_name}.
2. For hot drinks, ensure water/milk is heated to the correct temperature. For cold drinks, use ample ice or chill ingredients beforehand.

STEP 3 — SERVING:
1. Garnish as desired and serve immediately.
2. Enjoy your ${recipe.dish_name}!`;
    } else {
      newRecipeText = `BEGINNER MASTER RECIPE — ${recipe.dish_name}
==================================================
A delicious serving of ${recipe.dish_name}.

INGREDIENTS YOU WILL NEED:
Please check the ingredients tab for specific components.

STRUCTURED STEP-BY-STEP:

STEP 1 — PREPARATION:
1. Gather all required ingredients for ${recipe.dish_name}.
2. Prep your ingredients according to standard culinary techniques (chopping, dicing, measuring).

STEP 2 — COOKING:
1. Combine the ingredients following traditional methods for this dish.
2. Cook until the desired consistency and flavor profile are achieved.
3. Taste and adjust seasoning as needed.

STEP 3 — SERVING:
1. Plate the dish beautifully and serve warm or cold as appropriate.
2. Enjoy your homemade ${recipe.dish_name}!`;
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ detailed_recipe: newRecipeText })
      .eq('id', recipe.id);
      
    if (updateError) {
      console.error(`Failed to update ${recipe.dish_name}:`, updateError);
    }
  }
  console.log("Rectification complete.");
}

rectifyRecipes();
