require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const recipeText = `BEGINNER MASTER RECIPE — Filter Coffee
==================================================
A strong, frothy South Indian coffee classic.
Serves 2 | Prep: 2 min | Cook: 15 min | Difficulty: Easy | Spice: 0/5 | Indian cuisine

INGREDIENTS YOU WILL NEED:
• 3 tablespoons Indian filter coffee powder (with chicory)
• 1 cup Water
• 1 cup Whole milk
• 2 teaspoons Sugar (or to taste)

EQUIPMENT YOU NEED:
• Traditional Indian coffee filter (or drip coffee maker)
• Saucepan

STRUCTURED STEP-BY-STEP:

STEP 1 — BREW DECOCTION:
1. Place the coffee powder in the upper chamber of the filter and press down lightly with the umbrella plunger.
2. Boil 1 cup of water and pour it over the coffee. Cover and let it drip into the lower chamber for 10-15 minutes to extract a strong decoction.

STEP 2 — BOIL MILK:
1. Meanwhile, bring the milk to a boil in a saucepan. Add sugar to the hot milk and stir until dissolved.

STEP 3 — MIX:
1. Divide the coffee decoction equally between two cups (or traditional stainless steel davara tumblers).
2. Pour the hot milk into the decoction from a height to create a thick, frothy layer. Serve piping hot.`;

async function fixRecipes() {
  const names = ['Filter Coffee', 'Filter Coffee (Madras)'];
  for (const name of names) {
    const { error } = await supabase
      .from('recipes')
      .update({ detailed_recipe: recipeText })
      .eq('dish_name', name);
    
    if (error) {
      console.error('Error updating', name, error);
    } else {
      console.log('Successfully updated recipe for:', name);
    }
  }
}

fixRecipes();
