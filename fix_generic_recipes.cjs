require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const specificRecipes = {
  'Cappuccino': `BEGINNER MASTER RECIPE — Cappuccino
==================================================
Italian morning coffee — espresso under foamed milk.
Serves 1 | Prep: 1 min | Cook: 3 min | Difficulty: Easy | Spice: 0/5 | Italian cuisine

INGREDIENTS YOU WILL NEED:
• 1 shot (1 oz) espresso (or strong brewed coffee)
• 1/3 cup cold whole milk

EQUIPMENT YOU NEED:
• Espresso machine or Moka pot
• Milk frother or French press
• Coffee mug

STRUCTURED STEP-BY-STEP:

STEP 1 — BREW THE ESPRESSO:
1. Brew one shot of espresso (about 1 oz) directly into your coffee mug.

STEP 2 — PREPARE THE MILK:
1. Heat the milk in a small saucepan or microwave until hot (about 150°F or 65°C), but not boiling.
2. Froth the milk using a milk frother or by vigorously pumping it in a French press until it doubles in volume and forms a thick foam.

STEP 3 — ASSEMBLE:
1. Slowly pour the hot milk into the espresso, holding back the foam with a spoon.
2. Spoon the thick milk foam over the top. You should have roughly equal parts espresso, steamed milk, and foam.

STEP 4 — GARNISH (Optional):
1. Dust the top of the foam lightly with cocoa powder or cinnamon. Serve immediately.`,

  'Long Island Iced Tea': `BEGINNER MASTER RECIPE — Long Island Iced Tea
==================================================
A deceptively strong classic cocktail.
Serves 1 | Prep: 3 min | Difficulty: Medium | Spice: 0/5 | American cuisine

INGREDIENTS YOU WILL NEED:
• 1/2 oz Vodka
• 1/2 oz White Rum
• 1/2 oz Silver Tequila
• 1/2 oz Gin
• 1/2 oz Triple Sec
• 3/4 oz Fresh lemon juice
• 1/2 oz Simple syrup
• 1 to 2 oz Cola (to top)
• Lemon wedge (for garnish)
• Ice cubes

STRUCTURED STEP-BY-STEP:

STEP 1 — MIX THE SPIRITS:
1. Fill a cocktail shaker with ice.
2. Add the vodka, rum, tequila, gin, triple sec, lemon juice, and simple syrup to the shaker.

STEP 2 — SHAKE:
1. Shake vigorously for about 10-15 seconds until the mixture is well-chilled.

STEP 3 — ASSEMBLE:
1. Fill a tall highball glass with fresh ice.
2. Strain the mixture from the shaker into the glass.

STEP 4 — TOP AND GARNISH:
1. Top the glass with a splash of cola to give it the signature "tea" color.
2. Stir gently. Garnish with a lemon wedge and serve with a straw.`,

  'Singapore Sling': `BEGINNER MASTER RECIPE — Singapore Sling
==================================================
A fruity and complex gin-based cocktail.
Serves 1 | Prep: 5 min | Difficulty: Medium | Spice: 0/5 | Singapore cuisine

INGREDIENTS YOU WILL NEED:
• 1 1/2 oz Gin
• 1/2 oz Cherry liqueur (like Cherry Heering)
• 1/4 oz Cointreau
• 1/4 oz DOM Bénédictine
• 4 oz Pineapple juice
• 1/2 oz Fresh lime juice
• 1/3 oz Grenadine
• 1 dash Angostura bitters
• Pineapple slice and maraschino cherry (for garnish)

STRUCTURED STEP-BY-STEP:

STEP 1 — SHAKE:
1. Combine all liquid ingredients in a cocktail shaker filled with ice.
2. Shake vigorously for 15 seconds.

STEP 2 — STRAIN:
1. Strain the mixture into a tall Collins or Hurricane glass filled with fresh ice.

STEP 3 — GARNISH:
1. Garnish with a slice of fresh pineapple and a maraschino cherry. Serve immediately.`,

  'Filter Coffee (Mysore)': `BEGINNER MASTER RECIPE — Filter Coffee (Mysore)
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
2. Pour the hot milk into the decoction from a height to create a thick, frothy layer. Serve piping hot.`,

  'Coorg Coffee': `BEGINNER MASTER RECIPE — Coorg Coffee
==================================================
Rich, aromatic coffee from the hills of Coorg.
Serves 2 | Prep: 2 min | Cook: 10 min | Difficulty: Easy | Spice: 0/5 | Indian cuisine

INGREDIENTS YOU WILL NEED:
• 3 tablespoons Coorg Arabica/Robusta coffee powder
• 1.5 cups Water
• 1/2 cup Milk (optional)
• Jaggery or sugar to taste

STRUCTURED STEP-BY-STEP:

STEP 1 — BREW:
1. Bring the water to a rolling boil in a pot.
2. Add the coffee powder, stir well, and let it simmer for 2 minutes to extract the robust flavors.

STEP 2 — SETTLE:
1. Turn off the heat, cover the pot, and let the coffee grounds settle at the bottom for about 3-5 minutes.

STEP 3 — SERVE:
1. Gently decant or strain the clear black coffee into cups.
2. Sweeten with jaggery or sugar. Enjoy it black, or add a splash of hot milk if preferred.`
};

async function fixRecipes() {
  for (const [name, recipeText] of Object.entries(specificRecipes)) {
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
