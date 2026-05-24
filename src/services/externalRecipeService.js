/**
 * externalRecipeService.js
 *
 * Unified service for querying multiple external food/recipe APIs.
 * Priority chain: TheMealDB (free, no key) → Spoonacular
 *
 * Supported sources:
 *  - TheMealDB  : Free REST API, no key. Best for dish-name lookups & cuisine browsing.
 *  - Spoonacular: REST API. Requires VITE_SPOONACULAR_API_KEY. Best for ingredient matching.
 */

const THEMEALDB_BASE   = 'https://www.themealdb.com/api/json/v1/1';
const SPOONACULAR_BASE = 'https://api.spoonacular.com';
import { culinaryDataBank } from '../data/culinaryData';

// ─── TheMealDB ───────────────────────────────────────────────────────────────

/**
 * Search TheMealDB by dish name.
 * Returns an array of normalised recipe objects, or [].
 */
export const searchMealDB = async (query) => {
  try {
    const res  = await fetch(`${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!json.meals) return [];
    return json.meals.map(normaliseMealDB);
  } catch (err) {
    console.warn('[MealDB] Search failed:', err.message);
    return [];
  }
};

/**
 * Filter TheMealDB by a single main ingredient.
 * Returns a lightweight list (id + name + thumb) that can be enriched later.
 */
export const filterMealDBByIngredient = async (ingredient) => {
  try {
    const slug = ingredient.trim().replace(/\s+/g, '_');
    const res  = await fetch(`${THEMEALDB_BASE}/filter.php?i=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (!json.meals) return [];
    // Thin results — enrich one at a time on demand via lookupMealDBById
    return json.meals.slice(0, 12).map(m => ({
      id        : `mealdb_${m.idMeal}`,
      source    : 'TheMealDB',
      title     : m.strMeal,
      thumbnail : m.strMealThumb,
      externalId: m.idMeal,
    }));
  } catch (err) {
    console.warn('[MealDB] Ingredient filter failed:', err.message);
    return [];
  }
};

/**
 * Fetch full meal detail from TheMealDB by ID.
 */
export const lookupMealDBById = async (id) => {
  try {
    const res  = await fetch(`${THEMEALDB_BASE}/lookup.php?i=${id}`);
    const json = await res.json();
    if (!json.meals) return null;
    return normaliseMealDB(json.meals[0]);
  } catch (err) {
    console.warn('[MealDB] Lookup failed:', err.message);
    return null;
  }
};

/**
 * Get a random meal from TheMealDB.
 */
export const getRandomMealDB = async () => {
  try {
    const res  = await fetch(`${THEMEALDB_BASE}/random.php`);
    const json = await res.json();
    if (!json.meals) return null;
    return normaliseMealDB(json.meals[0]);
  } catch (err) {
    console.warn('[MealDB] Random meal failed:', err.message);
    return null;
  }
};

/**
 * List all meal categories from TheMealDB.
 */
export const getMealDBCategories = async () => {
  try {
    const res  = await fetch(`${THEMEALDB_BASE}/categories.php`);
    const json = await res.json();
    return json.categories || [];
  } catch (err) {
    console.warn('[MealDB] Categories failed:', err.message);
    return [];
  }
};

/**
 * Filter TheMealDB meals by category.
 */
export const filterMealDBByCategory = async (category) => {
  try {
    const res  = await fetch(`${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
    const json = await res.json();
    if (!json.meals) return [];
    return json.meals.slice(0, 20).map(m => ({
      id        : `mealdb_${m.idMeal}`,
      source    : 'TheMealDB',
      title     : m.strMeal,
      thumbnail : m.strMealThumb,
      externalId: m.idMeal,
    }));
  } catch (err) {
    console.warn('[MealDB] Category filter failed:', err.message);
    return [];
  }
};

/**
 * Filter TheMealDB meals by area/cuisine (e.g. "Italian", "Japanese").
 */
export const filterMealDBByArea = async (area) => {
  try {
    const res  = await fetch(`${THEMEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`);
    const json = await res.json();
    if (!json.meals) return [];
    return json.meals.slice(0, 20).map(m => ({
      id        : `mealdb_${m.idMeal}`,
      source    : 'TheMealDB',
      title     : m.strMeal,
      thumbnail : m.strMealThumb,
      externalId: m.idMeal,
    }));
  } catch (err) {
    console.warn('[MealDB] Area filter failed:', err.message);
    return [];
  }
};

// ─── Spoonacular ─────────────────────────────────────────────────────────────

const SPOONACULAR_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;

// ─── Allergy/Dietary Pre-cleaning & Calculation Helpers ──────────────────────────

/**
 * Pre-clean ingredients text to replace safe allergy-free ingredients with placeholders.
 * This prevents false positives like "almond flour" or "coconut milk" triggering gluten/dairy alarms.
 */
export const preCleanIngredientsText = (text) => {
  let cleaned = text.toLowerCase();

  // Replace common false positives for nuts
  cleaned = cleaned.replace(/\bbutternut squash\b/g, 'safe_squash');
  cleaned = cleaned.replace(/\bbutternut\b/g, 'safe_squash');
  cleaned = cleaned.replace(/\bnutmeg\b/g, 'safe_spice');
  cleaned = cleaned.replace(/\bcoconut\b/g, 'safe_coconut');

  // Replace common false positives for gluten
  const safeGlutenFreeItems = [
    'gluten-free flour', 'gluten free flour', 'rice flour', 'almond flour', 'coconut flour',
    'tapioca flour', 'chickpea flour', 'oat flour', 'corn flour', 'corn starch', 'cornstarch',
    'potato starch', 'potato flour', 'sweet potato flour', 'cassava flour', 'sorghum flour',
    'buckwheat flour', 'arrowroot starch', 'arrowroot powder', 'tapioca starch', 'tapioca pearl',
    'gluten-free pasta', 'gluten free pasta', 'gluten-free bread', 'gluten free bread'
  ];
  safeGlutenFreeItems.forEach(item => {
    const regex = new RegExp(`\\b${item}\\b`, 'g');
    cleaned = cleaned.replace(regex, 'safe_gf_item');
  });

  // Replace common false positives for dairy
  const safeDairyFreeItems = [
    'coconut milk', 'coconut cream', 'almond milk', 'soy milk', 'oat milk', 'rice milk',
    'cashew milk', 'macadamia milk', 'hemp milk', 'pea milk', 'vegan butter', 'vegan cheese',
    'vegan cream', 'vegan margarine', 'dairy-free butter', 'dairy free butter', 'dairy-free cheese',
    'dairy free cheese', 'dairy-free yogurt', 'dairy free yogurt', 'plant butter', 'plant-based butter',
    'plant-based cheese', 'plant-based milk', 'cocoa butter', 'shea butter', 'coconut butter'
  ];
  safeDairyFreeItems.forEach(item => {
    const regex = new RegExp(`\\b${item}\\b`, 'g');
    cleaned = cleaned.replace(regex, 'safe_df_item');
  });

  return cleaned;
};

/**
 * Determine recipe allergy and dietary preference flags based on ingredients.
 */
export const determineAllergyFlags = (ingredients = [], category = '', tags = []) => {
  const ingredientsText = preCleanIngredientsText(ingredients.join(' '));
  const categoryText = category.toLowerCase();
  const tagsText = tags.join(' ').toLowerCase();
  const fullText = `${ingredientsText} ${categoryText} ${tagsText}`;

  // Peanut / Nut Allergy
  const nutRegex = /\b(peanut|almond|walnut|cashew|pecan|hazelnut|macadamia|pistachio|chestnut|hazelnut|nut)\b/i;
  let containsNuts = false;
  if (nutRegex.test(fullText)) {
    const words = fullText.match(/\b\w+\b/g) || [];
    containsNuts = words.some(w => 
      (w.includes('nut') || w === 'almond' || w === 'walnut' || w === 'cashew' || w === 'pecan' || w === 'hazelnut' || w === 'macadamia' || w === 'pistachio') &&
      w !== 'coconut' && w !== 'nutmeg' && w !== 'butternut' && w !== 'safe_squash' && w !== 'safe_spice' && w !== 'safe_coconut'
    );
  }

  // Gluten Free
  const glutenRegex = /\b(wheat|barley|rye|flour|semolina|spelt|pasta|bread|couscous)\b/i;
  let isGlutenFree = true;
  if (glutenRegex.test(fullText)) {
    const hasGlutenFreeDecl = fullText.includes('gluten-free') || fullText.includes('gluten free') || fullText.includes('safe_gf_item');
    if (!hasGlutenFreeDecl) {
      isGlutenFree = false;
    }
  }

  // Dairy Free
  const dairyRegex = /\b(milk|cheese|butter|cream|yogurt|ghee|paneer|curd|whey|casein)\b/i;
  let containsDairy = false;
  if (dairyRegex.test(fullText)) {
    const hasDairyFreeDecl = fullText.includes('dairy-free') || fullText.includes('dairy free') || fullText.includes('safe_df_item');
    if (!hasDairyFreeDecl) {
      containsDairy = true;
    }
  }

  // Vegetarian / Vegan
  const nonVegRegex = /\b(meat|chicken|pork|beef|turkey|lamb|bacon|sausage|fish|salmon|tuna|shrimp|prawn|seafood|crab|lobster|steak|ham|duck|venison|veal|anchovy|anchovies|gelatin|lard)\b/i;
  let isVegetarian = !nonVegRegex.test(fullText);
  if (categoryText.includes('chicken') || categoryText.includes('beef') || categoryText.includes('pork') || categoryText.includes('seafood') || categoryText.includes('meat')) {
    isVegetarian = false;
  }

  let isVegan = isVegetarian;
  if (isVegan) {
    const nonVeganRegex = /\b(milk|cheese|butter|cream|yogurt|ghee|paneer|curd|egg|eggs|honey|whey|casein)\b/i;
    if (nonVeganRegex.test(fullText)) {
      const hasVeganDecl = fullText.includes('vegan') || fullText.includes('plant-based');
      if (!hasVeganDecl) {
        isVegan = false;
      }
    }
  }

  return {
    is_vegetarian: isVegetarian,
    is_vegan: isVegan,
    is_gluten_free: isGlutenFree,
    contains_dairy: containsDairy,
    contains_nuts: containsNuts
  };
};

// ─── Spoonacular ─────────────────────────────────────────────────────────────

/**
 * Search Spoonacular recipes by a list of ingredients (the "what's in my fridge" mode).
 * Requires VITE_SPOONACULAR_API_KEY.
 * Employs Spoonacular's complexSearch to return fully enriched recipe information in a single query.
 */
export const searchSpoonacularByIngredients = async (ingredients = [], number = 10) => {
  if (!SPOONACULAR_KEY) {
    console.warn('[Spoonacular] API key not set (VITE_SPOONACULAR_API_KEY).');
    return [];
  }
  try {
    const params = new URLSearchParams({
      apiKey      : SPOONACULAR_KEY,
      includeIngredients : ingredients.join(','),
      number      : String(number),
      ranking     : '1',
      ignorePantry: 'true',
      addRecipeInformation: 'true',
      fillIngredients: 'true',
    });
    const res  = await fetch(`${SPOONACULAR_BASE}/recipes/complexSearch?${params}`);
    if (res.status === 402) {
      throw new Error('Spoonacular API key limit reached (402)');
    }
    const json = await res.json();
    return (json.results || []).map(normaliseSpoonacular);
  } catch (err) {
    console.warn('[Spoonacular] Ingredient search failed:', err.message);
    return [];
  }
};

/**
 * Search Spoonacular by free-text query (dish name, cuisine, etc.).
 */
export const searchSpoonacular = async (query, number = 10) => {
  if (!SPOONACULAR_KEY) {
    console.warn('[Spoonacular] API key not set (VITE_SPOONACULAR_API_KEY).');
    return [];
  }
  try {
    const params = new URLSearchParams({
      apiKey      : SPOONACULAR_KEY,
      query,
      number      : String(number),
      addRecipeInformation: 'true',
      fillIngredients: 'true',
    });
    const res  = await fetch(`${SPOONACULAR_BASE}/recipes/complexSearch?${params}`);
    if (res.status === 402) {
      throw new Error('Spoonacular API key limit reached (402)');
    }
    const json = await res.json();
    return (json.results || []).map(normaliseSpoonacular);
  } catch (err) {
    console.warn('[Spoonacular] Query search failed:', err.message);
    return [];
  }
};

/**
 * Get full Spoonacular recipe information by ID.
 */
export const getSpoonacularRecipe = async (id) => {
  if (!SPOONACULAR_KEY) return null;
  try {
    const params = new URLSearchParams({ apiKey: SPOONACULAR_KEY });
    const res  = await fetch(`${SPOONACULAR_BASE}/recipes/${id}/information?${params}`);
    const r    = await res.json();
    return normaliseSpoonacular(r);
  } catch (err) {
    console.warn('[Spoonacular] Recipe lookup failed:', err.message);
    return null;
  }
};

// ─── Spoonacular ─────────────────────────────────────────────────────────────

// ─── Smart Multi-Source Search ────────────────────────────────────────────────

/**
 * fetchRecipesByIngredients
 * 
 * The primary entry point for the AI Recipe Generator.
 * Strategy:
 *  1. If Spoonacular key exists → use complexSearch with includeIngredients (best multi-ingredient match, fully enriched)
 *  2. Else use the primary ingredient in TheMealDB and enrich results in parallel
 *  3. Merge & deduplicate results
 */
export const fetchRecipesByIngredients = async (ingredients = []) => {
  try {
    if (!ingredients || ingredients.length === 0) return [];
    
    // Attempt Spoonacular and MealDB in parallel!
    const [spoonRes, mealdbRes] = await Promise.allSettled([
      SPOONACULAR_KEY ? searchSpoonacularByIngredients(ingredients, 6) : Promise.resolve([]),
      ingredients.length > 0 ? filterMealDBByIngredient(ingredients[0]) : Promise.resolve([])
    ]);

    const results = [
      ...(mealdbRes.status === 'fulfilled' && mealdbRes.value ? mealdbRes.value : []),
      ...(spoonRes.status === 'fulfilled' && spoonRes.value ? spoonRes.value : []),
    ];

    const seen = new Set();
    return results.filter(r => {
      if (!r || !r.id || !r.title) return false;
      const key = r.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    console.warn('[Recipe Fetch] Error:', err);
    return [];
  }
};

/**
 * fetchRecipesByDishName
 * 
 * Searches all available sources by a dish name string.
 * Returns merged, deduplicated results sorted by source priority.
 */
export const fetchRecipesByDishName = async (dishName) => {
  const [mealdb, spoon] = await Promise.allSettled([
    searchMealDB(dishName),
    SPOONACULAR_KEY ? searchSpoonacular(dishName, 5) : Promise.resolve([]),
  ]);

  const results = [
    ...(mealdb.status === 'fulfilled' ? mealdb.value : []),
    ...(spoon.status  === 'fulfilled' ? spoon.value  : []),
  ];

  const seen = new Set();
  return results.filter(r => {
    const key = r.title?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Mapping of internal cuisine names to TheMealDB's supported Area names.
 * This ensures that specific regional tags fetch the most relevant global dishes.
 */
const CUISINE_TO_AREA_MAP = {
  'Afghan': 'Turkish', // Closest match in MealDB areas
  'African': 'Kenyan',
  'Arab': 'Egyptian',
  'Asian': 'Chinese',
  'Bengali': 'Indian',
  'British': 'British',
  'Caribbean': 'Jamaican',
  'Chinese': 'Chinese',
  'European': 'French',
  'French': 'French',
  'Greek': 'Greek',
  'Indian': 'Indian',
  'Indonesian': 'Malaysian',
  'Italian': 'Italian',
  'Japanese': 'Japanese',
  'Korean': 'Japanese', // Fallback for specific East Asian
  'Malaysian': 'Malaysian',
  'Mexican': 'Mexican',
  'Middle Eastern': 'Egyptian',
  'Moroccan': 'Moroccan',
  'Pakistani': 'Indian',
  'Punjabi': 'Indian',
  'Spanish': 'Spanish',
  'Thai': 'Thai',
  'Turkish': 'Turkish',
  'Vietnamese': 'Vietnamese',
};

/**
 * fetchRecipesByCuisine
 * 
 * Returns a gallery of dishes for a given cuisine/area name.
 * Uses TheMealDB area filter (always free, enriched in parallel) + Spoonacular if available.
 */
export const fetchRecipesByCuisine = async (cuisine) => {
  const cuisineLower = cuisine.toLowerCase();
  let results = [];

  // 0. Fetch from local culinaryDataBank first
  Object.entries(culinaryDataBank).forEach(([key, dish]) => {
    // Check if the dish has the cuisine as a tag, or if the description/title mentions it
    const hasTag = dish.tags?.some(t => t.toLowerCase() === cuisineLower || t.toLowerCase().includes(cuisineLower));
    const inTitleOrDesc = dish.title?.toLowerCase().includes(cuisineLower) || dish.description?.toLowerCase().includes(cuisineLower);
    
    // Some general mapping (if they select "Indian", match all regional Indian tags too)
    const indianRegions = ['south indian', 'north indian', 'punjabi', 'tamil nadu', 'kerala', 'karnataka', 'maharashtrian', 'bengali', 'awadhi', 'chettinad', 'goan', 'gujarati', 'hyderabadi', 'rajasthani', 'kashmiri'];
    const isIndianRegion = cuisineLower === 'indian' && dish.tags?.some(t => indianRegions.includes(t.toLowerCase()));

    if (hasTag || inTitleOrDesc || isIndianRegion) {
      results.push({
        id: `local_${key}`,
        source: 'Epicurean DB',
        title: dish.title,
        thumbnail: null, // Will render placeholder
        externalId: key,
        time: dish.time,
        area: cuisine,
        usedCount: undefined
      });
    }
  });

  // 1. Try to map to a known MealDB Area
  const area = CUISINE_TO_AREA_MAP[cuisine] || cuisine;

  const [mealdb, spoon] = await Promise.allSettled([
    filterMealDBByArea(area),
    SPOONACULAR_KEY ? searchSpoonacular(`${cuisine} cuisine`, 8) : Promise.resolve([]),
  ]);

  if (mealdb.status === 'fulfilled') {
    // Enrich MealDB area results in parallel
    const enriched = await Promise.all(
      mealdb.value.map(async (m) => {
        const fullDetails = await lookupMealDBById(m.externalId);
        return fullDetails ? { ...m, ...fullDetails } : m;
      })
    );
    results.push(...enriched);
  }

  if (spoon.status === 'fulfilled') {
    results.push(...spoon.value);
  }

  // 2. Fallback: If external APIs are empty and no local dishes found, try a general search by dish name for the cuisine
  if (results.length === 0) {
    const fallback = await searchMealDB(cuisine);
    results.push(...fallback);
  }

  const seen = new Set();
  return results.filter(r => {
    const key = r.title?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ─── Normalisers ─────────────────────────────────────────────────────────────

/**
 * Convert a raw TheMealDB meal object → app-standard recipe object.
 */
function normaliseMealDB(m) {
  // Extract ingredients (MealDB stores them as strIngredient1…strIngredient20)
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing    = m[`strIngredient${i}`]?.trim();
    const measure = m[`strMeasure${i}`]?.trim();
    if (ing) ingredients.push(measure ? `${measure} ${ing}` : ing);
  }

  // Build step list from strInstructions
  const rawInstructions = m.strInstructions || '';
  const instructions = rawInstructions
    .split(/\r?\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 5)
    .slice(0, 20);

  const tags = m.strTags ? m.strTags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const allergyFlags = determineAllergyFlags(ingredients, m.strCategory || '', tags);

  return {
    id          : `mealdb_${m.idMeal}`,
    source      : 'TheMealDB',
    externalId  : m.idMeal,
    title       : m.strMeal,
    thumbnail   : m.strMealThumb,
    category    : m.strCategory,
    area        : m.strArea,
    tags,
    youtubeUrl  : m.strYoutube || null,
    ingredients,
    instructions,
    description : `A traditional ${m.strArea || ''} ${m.strCategory || 'dish'} — ${m.strMeal}.`,
    time        : null,    // MealDB does not provide cook time
    calories    : null,    // MealDB does not provide nutrition
    ...allergyFlags,
  };
}

/**
 * Convert a raw Spoonacular recipe object → app-standard recipe object.
 */
function normaliseSpoonacular(r) {
  const ingredients = (r.extendedIngredients || []).map(
    i => `${i.measures?.metric?.amount ? i.measures.metric.amount + ' ' + i.measures.metric.unitShort + ' ' : ''}${i.nameClean || i.name}`
  );

  const instructions = [];
  if (r.analyzedInstructions?.length > 0) {
    r.analyzedInstructions[0].steps?.forEach(s => instructions.push(s.step));
  } else if (r.instructions) {
    instructions.push(r.instructions.replace(/<[^>]*>/g, ''));
  }

  const tags = r.dishTypes || [];
  const allergyFlags = determineAllergyFlags(ingredients, '', tags);

  return {
    id         : `spoon_${r.id}`,
    source     : 'Spoonacular',
    externalId : String(r.id),
    title      : r.title,
    thumbnail  : r.image,
    tags,
    time       : r.readyInMinutes ? `${r.readyInMinutes} mins` : null,
    servings   : r.servings,
    calories   : r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || null,
    ingredients,
    instructions,
    description: r.summary ? r.summary.replace(/<[^>]*>/g, '').slice(0, 250) + '...' : '',
    youtubeUrl : null,
    ...allergyFlags,
  };
}

// ─── Status / Availability Check ─────────────────────────────────────────────

// ─── Status / Availability Check ─────────────────────────────────────────────

/**
 * Returns an object indicating which external data sources are currently configured.
 * Useful to display in UI (e.g. "Powered by: TheMealDB ✓  Spoonacular ✓").
 */
export const getApiStatus = () => ({
  mealDB     : true,                                   // Always available (free REST API)
  spoonacular: !!SPOONACULAR_KEY,
});
