import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const STOP_WORDS = new Set(['i', 'have', 'got', 'want', 'a', 'an', 'the', 'and', 'or', 'with', 'some']);
const TIME_WORDS = new Set(['min', 'mins', 'minute', 'minutes', 'hour', 'hours', 'hr', 'hrs', 'sec', 'secs']);

function parseQuery(text) {
  const lower = text.toLowerCase();
  const timeMatch = lower.match(/(\d+)\s*(?:min|mins|minute|minutes)/);
  const maxTime = timeMatch ? parseInt(timeMatch[1], 10) : null;
  const dietary = {
    vegan: /\bvegan\b/.test(lower),
    vegetarian: /\bvegetarian\b/.test(lower),
    glutenFree: /\bgluten.?free\b/.test(lower),
    dairyFree: /\bdairy.?free\b/.test(lower),
    keto: /\bketo\b/.test(lower),
    spicy: /\b(spicy|spice|hot)\b/.test(lower),
  };
  const tokens = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !STOP_WORDS.has(t) && !TIME_WORDS.has(t) && !/^\d+$/.test(t));
  return { ingredients: [...new Set(tokens)], maxTime, dietary };
}

const getSearchRelevanceScore = (recipe, queryText, queryTokens) => {
  if (!recipe || !queryText) return 0;
  const recipeName = recipe.dish_name || recipe.title || '';
  const nameLower = recipeName.toLowerCase().trim();
  const queryLower = queryText.toLowerCase().trim();
  if (nameLower === queryLower) return 10000;
  if (nameLower.startsWith(queryLower)) return 5000;
  const wordBoundaryRegex = new RegExp(`\\b${queryLower}\\b`, 'i');
  if (wordBoundaryRegex.test(nameLower)) return 2000;
  let score = 0;
  if (queryTokens && queryTokens.length > 0) {
    const nameWords = nameLower.split(/[\s,\(\)]+/);
    queryTokens.forEach(token => {
      const tokLower = token.toLowerCase();
      if (nameWords.includes(tokLower)) score += 500;
      else if (nameWords.some(w => w.startsWith(tokLower))) score += 200;
      else if (nameLower.includes(tokLower)) score += 10;
    });
  }
  return score;
};

const filterRecipeByAllergiesAndRestrictions = (recipe, restrictions) => {
  const hasPeanutAllergy = restrictions.some(r => /peanut|nut/i.test(r));
  const isGlutenFreePref = restrictions.some(r => /gluten/i.test(r));
  const isVeganPref = restrictions.some(r => /vegan/i.test(r));
  const isVegetarianPref = restrictions.some(r => /veget/i.test(r));
  const isDairyFreePref = restrictions.some(r => /dairy|milk|lactose/i.test(r));
  if (recipe.contains_nuts !== undefined && recipe.contains_nuts && hasPeanutAllergy) return false;
  if (recipe.is_gluten_free !== undefined && !recipe.is_gluten_free && isGlutenFreePref) return false;
  if (recipe.is_vegan !== undefined && !recipe.is_vegan && isVeganPref) return false;
  if (recipe.is_vegetarian !== undefined && !recipe.is_vegetarian && isVegetarianPref) return false;
  if (recipe.contains_dairy !== undefined && recipe.contains_dairy && isDairyFreePref) return false;
  return true;
};

async function getUnifiedFullSearchMock(query, filters) {
  const { ingredients, dietary, maxTime } = filters;
  let dbNameQb = supabase.from('recipes').select('*');
  let dbQb = supabase.from('recipes').select('*');
  
  if (ingredients.length > 0) {
    const orConditions = [];
    ingredients.forEach((ing) => {
      orConditions.push(`key_ingredients.ilike.%${ing}%`);
      orConditions.push(`dish_name.ilike.%${ing}%`);
      orConditions.push(`cuisine.ilike.%${ing}%`);
      orConditions.push(`description.ilike.%${ing}%`);
    });
    dbQb = dbQb.or(orConditions.join(','));
  }
  
  if (query) {
    dbNameQb = dbNameQb.ilike('dish_name', `%${query}%`);
  }
  
  const [dbNameRes, dbRes] = await Promise.all([dbNameQb.limit(10), dbQb.limit(10)]);
  let allRecipes = [...(dbNameRes.data || []), ...(dbRes.data || [])];
  
  const seen = new Set();
  let unique = allRecipes.filter(r => {
    const key = r.dish_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return { results: unique };
}

async function runTest() {
  const query = "Cornbread";
  const { ingredients, maxTime, dietary } = parseQuery(query);
  console.log("Parsed Query:", { ingredients, maxTime, dietary });

  const { results: uniqueRecipes } = await getUnifiedFullSearchMock(query, { ingredients, dietary, maxTime });
  console.log("Unique Recipes from search:", uniqueRecipes.length, uniqueRecipes.map(r => r.dish_name));

  const activeRestrictions = ['low sodium', 'vegeterian'];

  const allergyFiltered = uniqueRecipes.filter(recipe => {
    if (!filterRecipeByAllergiesAndRestrictions(recipe, activeRestrictions)) {
        console.log("Filtered by allergy:", recipe.dish_name);
        return false;
    }
    if (dietary.vegan && recipe.is_vegan === false) return false;
    if (dietary.vegetarian && recipe.is_vegetarian === false) return false;
    if (dietary.glutenFree && recipe.is_gluten_free === false) return false;
    return true;
  });
  console.log("After allergy filter:", allergyFiltered.length, allergyFiltered.map(r => r.dish_name));

  const healthGoals = {}; // what if glucoseTarget is set? Let's assume it isn't, or let's test if it is.
  const healthFiltered = allergyFiltered.filter(recipe => {
    if (healthGoals?.calories && recipe.calories && recipe.calories > Number(healthGoals.calories)) return false;
    const textToSearch = (recipe.dish_name + ' ' + (recipe.description || '') + ' ' + (recipe.full_ingredients || '')).toLowerCase();
    if (healthGoals?.glucoseTarget && /pasta|rice|bread|potato|sugar|honey/i.test(textToSearch)) {
        console.log("Filtered by health:", recipe.dish_name);
        return false;
    }
    return true;
  });
  console.log("After health filter:", healthFiltered.length, healthFiltered.map(r => r.dish_name));

  const scoredRecipes = healthFiltered.map(recipe => ({
    recipe,
    score: ingredients.length === 0 ? 500 : getSearchRelevanceScore(recipe, query, ingredients)
  })).filter(item => {
    if (item.score <= 0) console.log("Filtered by score:", item.recipe.dish_name, item.score);
    return item.score > 0;
  });
  
  console.log("Final Scored Recipes:", scoredRecipes.length, scoredRecipes.map(r => `${r.recipe.dish_name} (${r.score})`));
}

runTest();
