import { supabase } from './supabaseClient';
import { fetchRecipesByDishName, fetchRecipesByIngredients } from './externalRecipeService';
import { culinaryDataBank, getDishImage } from '../data/culinaryData';

/**
 * Unifies search suggestions across Local Mock Data, Supabase, and Web APIs (MealDB/Spoonacular).
 * Returns lightweight objects for dropdowns.
 */
export const getUnifiedSuggestions = async (term) => {
  const lowerTerm = term.trim().toLowerCase();
  if (!lowerTerm) return [];

  // 1. Local Search (culinaryDataBank)
  const bankKeys = Object.keys(culinaryDataBank);
  const localMatches = bankKeys
    .filter(key => {
      const r = culinaryDataBank[key];
      const textToSearch = `${r.title || ''} ${key} ${r.description || ''} ${(r.tags || []).join(' ')}`.toLowerCase();
      return textToSearch.includes(lowerTerm);
    })
    .map((key, idx) => {
      const r = culinaryDataBank[key];
      return {
        id: `local-${key}-${idx}`,
        title: r.title,
        thumbnail: getDishImage(key, idx),
        source: 'Local',
        type: 'recipe',
        recipeData: r // keep local data
      };
    })
    .slice(0, 3);

  // 2. Supabase Search
  let dbMatches = [];
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .ilike('dish_name', `%${lowerTerm}%`)
      .limit(5);

    if (!error && data) {
      dbMatches = data.map(r => ({
        id: r.id,
        title: r.dish_name,
        thumbnail: r.image_url,
        source: 'Supabase',
        type: 'recipe',
        recipeData: r
      }));
    }
  } catch (err) {
    console.error('Supabase autocomplete error:', err);
  }

  // 3. Web API Search (MealDB & Spoonacular via externalRecipeService)
  let webMatches = [];
  try {
    const apiResults = await fetchRecipesByDishName(term);
    webMatches = apiResults.map(r => ({ ...r, type: 'recipe', recipeData: r })).slice(0, 5);
  } catch (err) {
    console.error('Web API autocomplete error:', err);
  }

  // Combine and deduplicate by title, prioritizing Supabase > Local > Web
  const combined = [...dbMatches, ...localMatches, ...webMatches];
  const seen = new Set();
  const unique = combined.filter(r => {
    const key = r.title?.toLowerCase() || '';
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 8); // Top 8 total
};

const withTimeout = (promise, ms = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

/**
 * Unifies full search results across all databases and maps them to a single standard schema
 * used by DiscoveryHome.
 */
export const getUnifiedFullSearch = async (query, filters = { ingredients: [], dietary: {}, maxTime: null }) => {
  const { ingredients, dietary, maxTime } = filters;
  const lowerQuery = query.toLowerCase();

  // dietary to supabase columns
  const dbFilters = {};
  if (dietary.vegan)       dbFilters.is_vegan       = true;
  if (dietary.vegetarian)  dbFilters.is_vegetarian  = true;
  if (dietary.glutenFree)  dbFilters.is_gluten_free = true;

  // 1. Supabase Exact Match Query
  let dbNameQb = supabase.from('recipes').select('*');
  Object.entries(dbFilters).forEach(([col, val]) => { dbNameQb = dbNameQb.eq(col, val); });
  if (maxTime) dbNameQb = dbNameQb.lte('total_time_min', maxTime);
  if (dietary.spicy) dbNameQb = dbNameQb.gt('spice_level', 0);
  dbNameQb = dbNameQb.ilike('dish_name', `%${query}%`).limit(10);

  // 1b. Supabase Fuzzy Match Query
  let dbQb = supabase.from('recipes').select('*');
  Object.entries(dbFilters).forEach(([col, val]) => { dbQb = dbQb.eq(col, val); });
  if (maxTime) dbQb = dbQb.lte('total_time_min', maxTime);
  if (dietary.spicy) dbQb = dbQb.gt('spice_level', 0);
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
  dbQb = dbQb.limit(20);

  // 2. Web API Query
  let webPromise = Promise.resolve([]);
  if (ingredients.length > 0) {
    webPromise = fetchRecipesByIngredients(ingredients);
  } else {
    const isGeneric = ['vegetarian', 'vegan', 'gluten', 'spicy', 'cuisine', 'meals', 'recipes', 'dishes', 'world', 'global', 'easy', 'quick'].some(w => query.toLowerCase().includes(w)) && ingredients.length === 0;
    if (!isGeneric) {
      webPromise = fetchRecipesByDishName(query);
    }
  }

  // 3. Local Mock DB Query
  const localSearchPromise = new Promise((resolve) => {
    const bankKeys = Object.keys(culinaryDataBank);
    const matches = bankKeys
      .filter(key => {
        const r = culinaryDataBank[key];
        const textToSearch = `${r.title} ${key} ${r.description || ''} ${(r.tags || []).join(' ')}`.toLowerCase();
        const textMatch = textToSearch.includes(lowerQuery);
        
        const ingredientMatch = ingredients.length > 0 && ingredients.some(ing => 
          (r.ingredients || []).some(i => i.toLowerCase().includes(ing)) ||
          (r.tags || []).some(t => t.toLowerCase().includes(ing))
        );
        return textMatch || ingredientMatch;
      })
      .map((key, idx) => {
        const r = culinaryDataBank[key];
        return {
          id: `local-search-${key}-${idx}`,
          dish_name: r.title,
          cuisine: r.cuisine || 'Global',
          total_time_min: parseInt(r.time) || 30,
          difficulty: r.difficulty || 'Medium',
          spice_level: 0,
          is_vegetarian: r.tags?.some(t => /veg/i.test(t)),
          is_vegan: r.tags?.some(t => /vegan/i.test(t)),
          is_gluten_free: r.tags?.some(t => /gluten/i.test(t)),
          contains_dairy: false,
          contains_nuts: false,
          description: r.description || `A delicious local recipe for ${r.title}.`,
          image_url: getDishImage(key, idx),
          is_web: false,
          source: 'Local',
          full_ingredients: r.ingredients?.join('\n') || '',
          detailed_recipe: 'Local recipe instructions placeholder...'
        };
      });
    resolve(matches);
  });

  const [dbNameRes, dbRes, webRes, localRes] = await Promise.allSettled([
    withTimeout(dbNameQb),
    withTimeout(dbQb),
    withTimeout(webPromise),
    withTimeout(localSearchPromise)
  ]);

  // Prioritize Supabase over Local and Web
  let allRecipes = [];

  // 1. Combine Supabase
  if (dbNameRes.status === 'fulfilled' && !dbNameRes.value.error) {
    allRecipes = [...allRecipes, ...(dbNameRes.value.data || [])];
  }
  if (dbRes.status === 'fulfilled' && !dbRes.value.error) {
    const existingIds = new Set(allRecipes.map(r => r.id));
    const extra = (dbRes.value.data || []).filter(r => !existingIds.has(r.id));
    allRecipes = [...allRecipes, ...extra];
  }

  // 2. Combine Local
  if (localRes.status === 'fulfilled') {
    allRecipes = [...allRecipes, ...localRes.value];
  }

  // Combine Web APIs and Standardize Schema
  if (webRes.status === 'fulfilled') {
    const webMapped = (webRes.value || []).map(r => {
      const isVeg = r.is_vegetarian !== undefined ? r.is_vegetarian : (r.tags?.some(t => /veg/i.test(t)) || /vegetar/i.test(r.summary || '') || false);
      const isVegan = r.is_vegan !== undefined ? r.is_vegan : (r.tags?.some(t => /vegan/i.test(t)) || /vegan/i.test(r.summary || '') || false);
      const isGF = r.is_gluten_free !== undefined ? r.is_gluten_free : (r.tags?.some(t => /gluten/i.test(t)) || /gluten-free/i.test(r.summary || '') || false);
      const containsDairy = r.contains_dairy !== undefined ? r.contains_dairy : !isVegan;
      const containsNuts = r.contains_nuts !== undefined ? r.contains_nuts : false;
      return {
        id: r.id,
        dish_name: r.title,
        cuisine: r.area || 'Global',
        total_time_min: r.time ? parseInt(r.time) : (maxTime || 25),
        difficulty: 'Medium',
        spice_level: 0,
        is_vegetarian: isVeg,
        is_vegan: isVegan,
        is_gluten_free: isGF,
        contains_dairy: containsDairy,
        contains_nuts: containsNuts,
        description: r.description || r.summary || 'A delicious global recipe from the web.',
        image_url: r.thumbnail,
        is_web: true,
        source: r.source,
        externalId: r.externalId,
        full_ingredients: r.ingredients?.join('\n') || '',
        detailed_recipe: r.instructions?.join('\n') || ''
      };
    });
    allRecipes = [...allRecipes, ...webMapped];
  }

  // Deduplicate by title
  const seen = new Set();
  const unique = allRecipes.filter(r => {
    const key = r.dish_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
};
