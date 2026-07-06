import { supabase } from './supabaseClient';
import { fetchRecipesByDishName, fetchRecipesByIngredients } from './externalRecipeService';
import { culinaryDataBank, getDishImage } from '../data/culinaryData';
import { getDetectedCountry } from './currencyService';

const COUNTRY_CUISINE_MAP = {
  'IN': ['indian', 'rajasthani', 'marwari', 'kumaoni', 'mappila', 'bengali', 'punjabi', 'gujarati', 'maharashtrian', 'keralite', 'tamil', 'andhra', 'awadhi', 'hyderabadi', 'goan', 'kashmiri', 'chettinad', 'sindhi', 'bihari', 'assamese', 'odia', 'parsi', 'konkani', 'manglorean', 'udupi', 'malvani', 'mughlai', 'pahari', 'haryanvi'],
  'US': ['american', 'southern', 'tex-mex', 'cajun', 'creole', 'soul food', 'new england', 'hawaiian'],
  'GB': ['british', 'english', 'scottish', 'welsh', 'irish'],
  'EU': ['french', 'german', 'italian', 'spanish', 'dutch', 'belgian', 'austrian', 'portuguese', 'irish', 'finnish'],
  'AU': ['australian'],
  'CA': ['canadian']
};

/**
 * Fetches every distinct cuisine tag used across the `recipes` table.
 * `cuisine_tags` is a pipe-separated string per dish (e.g. "Awadhi|Indian|Mughlai");
 * this flattens and deduplicates them into a single sorted list for filter chips.
 */
export const fetchCuisineTags = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select('cuisine_tags')
    .not('cuisine_tags', 'is', null);

  if (error || !data) {
    console.error('Failed to fetch cuisine tags:', error);
    return [];
  }

  const tagSet = new Set();
  data.forEach(row => {
    (row.cuisine_tags || '').split('|').forEach(tag => {
      const clean = tag.trim();
      if (clean) tagSet.add(clean);
    });
  });

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
};

/**
 * Fetches dishes matching any of the selected cuisine tags (OR logic) via
 * cuisine_tags ILIKE. With no tags selected, returns an unfiltered page.
 */
export const fetchDishesByCuisineTags = async (selectedTags = [], limit = 40) => {
  let qb = supabase.from('recipes').select('*').limit(limit);

  if (selectedTags.length > 0) {
    qb = qb.or(selectedTags.map(t => `cuisine_tags.ilike.%${t}%`).join(','));
  }

  const { data, error } = await qb;
  if (error) {
    console.error('Failed to fetch dishes by cuisine tags:', error);
    return [];
  }
  return data || [];
};

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
export const getUnifiedFullSearch = async (query, filters = { ingredients: [], dietary: {}, maxTime: null }, page = 1) => {
  const { ingredients, dietary, maxTime } = filters;
  const pageSize = 40;
  const lowerQuery = query.toLowerCase();
  
  const genericKeywords = ['vegetarian', 'vegan', 'gluten', 'spicy', 'cuisine', 'meals', 'recipes', 'dishes', 'world', 'global', 'easy', 'quick', 'anything', 'surprise me', 'you decide', 'dont know', "don't know", 'whatever', 'random', 'decide for me'];
  const isGeneric = (!query || query.trim() === '' || genericKeywords.some(w => lowerQuery.includes(w))) && ingredients.length === 0;
  
  const isGlobalQuery = lowerQuery.includes('global') || lowerQuery.includes('world') || (!query || query.trim() === '');
  const userCountry = getDetectedCountry();
  const excludedCuisines = isGlobalQuery ? (COUNTRY_CUISINE_MAP[userCountry] || []) : [];

  // dietary to supabase columns
  const dbFilters = {};
  if (dietary.vegan || lowerQuery.includes('vegan'))       dbFilters.is_vegan       = true;
  if (dietary.vegetarian || lowerQuery.includes('vegetarian'))  dbFilters.is_vegetarian  = true;
  if (dietary.glutenFree || lowerQuery.includes('gluten'))  dbFilters.is_gluten_free = true;

  // 1. Supabase Exact Match Query
  let dbNameQb = supabase.from('recipes').select('*');
  Object.entries(dbFilters).forEach(([col, val]) => { dbNameQb = dbNameQb.eq(col, val); });
  if (maxTime) dbNameQb = dbNameQb.lte('total_time_min', maxTime);
  if (dietary.spicy) dbNameQb = dbNameQb.gt('spice_level', 0);
  if (!isGeneric && query) {
    dbNameQb = dbNameQb.ilike('dish_name', `%${query}%`);
  }
  excludedCuisines.forEach(c => {
    dbNameQb = dbNameQb.not('cuisine', 'ilike', `%${c}%`);
  });
  // Hardcoded limit for exact matches, but we only fetch exact matches on page 1
  dbNameQb = dbNameQb.limit(10);

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
  } else if (!isGeneric && query) {
    dbQb = dbQb.or(`description.ilike.%${query}%,cuisine.ilike.%${query}%`);
  }
  
  excludedCuisines.forEach(c => {
    dbQb = dbQb.not('cuisine', 'ilike', `%${c}%`);
  });
  
  // Pagination logic using range
  const from = (page - 1) * pageSize;
  const to = (page * pageSize) - 1;
  // We fetch one extra item to determine if there are more results
  dbQb = dbQb.range(from, to + 1);

  // 2. Web API Query
  let webPromise = Promise.resolve([]);
  if (ingredients.length > 0) {
    webPromise = fetchRecipesByIngredients(ingredients);
  } else {
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
        const isVeg = r.tags?.some(t => /veg/i.test(t));
        const isVegan = r.tags?.some(t => /vegan/i.test(t));
        const isGF = r.tags?.some(t => /gluten/i.test(t));
        
        if (dietary.vegetarian && !isVeg) return false;
        if (dietary.vegan && !isVegan) return false;
        if (dietary.glutenFree && !isGF) return false;

        const cuisineStr = (r.cuisine || '').toLowerCase();
        if (excludedCuisines.some(c => cuisineStr.includes(c))) {
          return false;
        }

        const textToSearch = `${r.title} ${key} ${r.description || ''} ${(r.tags || []).join(' ')}`.toLowerCase();
        const textMatch = textToSearch.includes(lowerQuery);
        
        const ingredientMatch = ingredients.length > 0 && ingredients.some(ing => 
          (r.ingredients || []).some(i => i.toLowerCase().includes(ing)) ||
          (r.tags || []).some(t => t.toLowerCase().includes(ing))
        );
        return (lowerQuery === '' && ingredients.length === 0) ? true : (textMatch || ingredientMatch);
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

  // Only run dbNameQb, web APIs, and local search on the first page
  const [dbNameRes, dbRes, webRes, localRes] = await Promise.allSettled([
    page === 1 ? withTimeout(dbNameQb) : Promise.resolve({ data: [] }),
    withTimeout(dbQb),
    page === 1 ? withTimeout(webPromise) : Promise.resolve([]),
    page === 1 ? withTimeout(localSearchPromise) : Promise.resolve([])
  ]);

  // Prioritize Supabase over Local and Web
  let allRecipes = [];

  // 1. Combine Supabase
  if (dbNameRes.status === 'fulfilled' && !dbNameRes.value.error) {
    allRecipes = [...allRecipes, ...(dbNameRes.value.data || [])];
  }
  let hasMore = false;
  if (dbRes.status === 'fulfilled' && !dbRes.value.error) {
    let dbData = dbRes.value.data || [];
    if (dbData.length > pageSize) {
      hasMore = true;
      dbData = dbData.slice(0, pageSize); // Remove the extra item
    }
    const existingIds = new Set(allRecipes.map(r => r.id));
    const extra = dbData.filter(r => !existingIds.has(r.id));
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
  let unique = allRecipes.filter(r => {
    const key = r.dish_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (isGeneric) {
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
  }

  return { results: unique, hasMore };
};
