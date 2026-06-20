import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const parseQuery = (query) => {
  if (!query) return { ingredients: [], maxTime: null, dietary: {} };
  const lower = query.toLowerCase();
  
  const dietary = {
    vegan: /vegan/i.test(lower),
    vegetarian: /vegetarian/i.test(lower),
    glutenFree: /gluten/i.test(lower),
    dairyFree: /dairy|milk|cheese/i.test(lower)
  };

  let maxTime = null;
  const timeMatch = lower.match(/(\d+)\s*(min|minute|hour|hr)/);
  if (timeMatch) {
    const val = parseInt(timeMatch[1]);
    if (timeMatch[2].startsWith('h')) maxTime = val * 60;
    else maxTime = val;
  }

  const STOP_WORDS = new Set(['and', 'with', 'or', 'without', 'some', 'any', 'for', 'in', 'a', 'an', 'the', 'make', 'cook', 'recipe', 'recipes', 'dish', 'dishes', 'food', 'meal']);
  const ingredients = lower
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w) && !timeMatch?.[0].includes(w) && !/vegan|vegetarian|gluten|dairy|free/i.test(w));

  return { ingredients, maxTime, dietary };
};

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

      const descLower = (recipe.description || '').toLowerCase();
      if (descLower.includes(tokLower)) score += 50;

      if (recipe.ingredients) {
        if (recipe.ingredients.some(ing => ing.toLowerCase().includes(tokLower))) {
          score += 100;
        }
      } else if (recipe.full_ingredients) {
         if (recipe.full_ingredients.toLowerCase().includes(tokLower)) {
           score += 100;
         }
      }
      
      if (recipe.cuisine && recipe.cuisine.toLowerCase().includes(tokLower)) score += 50;
      if (recipe.tags && recipe.tags.some(t => t.toLowerCase().includes(tokLower))) score += 50;
    });
  }
  return score;
};

async function run() {
  const query = "Cornbread";
  const { ingredients, maxTime, dietary } = parseQuery(query);
  
  // Fake unifiedSearchService response with real data
  const { data: allRecipes } = await supabase.from('recipes').select('*').ilike('dish_name', '%Cornbread%').limit(10);
  
  let uniqueRecipes = allRecipes;
  
  // Allergy
  const activeRestrictions = [];
  const allergyFiltered = uniqueRecipes.filter(recipe => {
     if (dietary.vegan && recipe.is_vegan === false) return false;
     if (dietary.vegetarian && recipe.is_vegetarian === false) return false;
     if (dietary.glutenFree && recipe.is_gluten_free === false) return false;
     return true;
  });
  
  // Health Filter Bypass logic
  const healthGoals = {}; // assume empty
  const healthFiltered = allergyFiltered.filter(recipe => {
    const queryLower = query.toLowerCase().trim();
    const nameLower = (recipe.dish_name || recipe.title || '').toLowerCase().trim();
    if (queryLower && (nameLower === queryLower || nameLower.startsWith(queryLower))) return true;

    if (healthGoals?.calories && recipe.calories && recipe.calories > Number(healthGoals.calories)) return false;
    const textToSearch = (recipe.dish_name + ' ' + (recipe.description || '') + ' ' + (recipe.full_ingredients || '')).toLowerCase();
    if (healthGoals?.glucoseTarget && /pasta|rice|bread|potato|sugar|honey/i.test(textToSearch)) return false;
    return true;
  });
  
  // Max Time
  const finalRecipes = healthFiltered.filter(recipe => {
    if (maxTime && recipe.total_time_min) {
      return recipe.total_time_min <= maxTime;
    }
    return true;
  });
  
  console.log("finalRecipes length:", finalRecipes.length);

  // Score
  const scoredRecipes = finalRecipes.map(recipe => ({
    recipe: recipe.dish_name,
    score: ingredients.length === 0 ? 500 : getSearchRelevanceScore(recipe, query, ingredients)
  })).filter(item => item.score > 0);
  
  console.log("scoredRecipes length:", scoredRecipes.length);
  console.log("scoredRecipes:", scoredRecipes);
}

run();
