import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const preCleanIngredientsText = (text) => {
  return text.toLowerCase()
    .replace(/coconut/g, 'safe_coconut')
    .replace(/nutmeg/g, 'safe_spice')
    .replace(/butternut/g, 'safe_squash');
};

const filterRecipeByAllergiesAndRestrictions = (recipe, restrictions) => {
  const hasPeanutAllergy = restrictions.some(r => /peanut|nut/i.test(r));
  const isGlutenFreePref = restrictions.some(r => /gluten/i.test(r));
  const isVeganPref = restrictions.some(r => /vegan/i.test(r));
  const isVegetarianPref = restrictions.some(r => /veget/i.test(r));
  const isDairyFreePref = restrictions.some(r => /dairy|milk|lactose/i.test(r));

  console.log(`Checking recipe: ${recipe.dish_name}`);
  console.log(`hasPeanutAllergy: ${hasPeanutAllergy}, isGlutenFreePref: ${isGlutenFreePref}, isVeganPref: ${isVeganPref}, isVegetarianPref: ${isVegetarianPref}, isDairyFreePref: ${isDairyFreePref}`);
  console.log(`recipe.is_vegetarian: ${recipe.is_vegetarian}`);

  if (recipe.contains_nuts !== undefined && recipe.contains_nuts && hasPeanutAllergy) { console.log('Failed nuts'); return false; }
  if (recipe.is_gluten_free !== undefined && !recipe.is_gluten_free && isGlutenFreePref) { console.log('Failed gluten'); return false; }
  if (recipe.is_vegan !== undefined && !recipe.is_vegan && isVeganPref) { console.log('Failed vegan'); return false; }
  if (recipe.is_vegetarian !== undefined && !recipe.is_vegetarian && isVegetarianPref) { console.log('Failed veg'); return false; }
  if (recipe.contains_dairy !== undefined && recipe.contains_dairy && isDairyFreePref) { console.log('Failed dairy'); return false; }

  return true;
};

async function test() {
  const { data } = await supabase.from('recipes').select('*').ilike('dish_name', '%cornbread%').limit(1);
  const recipe = data[0];
  console.log(recipe);
  
  const activeRestrictions = ['low sodium', 'vegeterian'];
  const res = filterRecipeByAllergiesAndRestrictions(recipe, activeRestrictions);
  console.log("Passed allergy filter?", res);
}

test();
