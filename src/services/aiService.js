import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabaseClient';
import useAppStore from '../store/useAppStore';

// Initialize the @google/genai v2 SDK.
// v2 API: ai.models.generateContent({ model, contents })
const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
// Google Gemini API keys are standard GCP keys and always start with the AIzaSy prefix.
const isValidApiKey = typeof rawApiKey === 'string' && rawApiKey.trim().startsWith('AIzaSy');

const ai = new GoogleGenAI({
  apiKey: isValidApiKey ? rawApiKey.trim() : 'PLACEHOLDER_KEY',
});

const safeGenerateContent = async (prompt, primaryModel = 'gemini-2.5-flash') => {
  const modelsToTry = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError;
  for (const model of uniqueModels) {
    try {
      console.log(`[AI] Trying model: ${model} via REST API`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${rawApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response format from REST API");
      }
    } catch (error) {
      console.warn(`[AI] Model "${model}" failed completely:`, error.message);
      lastError = error;
      if (
        error.message?.includes('API key not valid') ||
        error.message?.includes('API_KEY_INVALID') ||
        error.status === 401
      ) {
        throw error;
      }
    }
  }

  console.error('[AI] All models failed. Last error:', lastError?.message);
  throw lastError;
};

// ─── generateRecipe ───────────────────────────────────────────────────────────

export const generateRecipe = async (ingredients, cuisine = 'Global', dietaryRestrictions = []) => {
  const isArray = Array.isArray(ingredients);
  const dishName = isArray ? ingredients[0] : ingredients;
  const ingredientString = isArray ? ingredients.join(', ') : ingredients;
  const restrictionsStr = dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None';

  // `cuisine` may be a single cuisine name or an array of selected cuisine_tags
  // (e.g. ['Awadhi', 'Mughlai']) from the cuisine filter chips.
  const cuisineTags = (Array.isArray(cuisine) ? cuisine : [cuisine]).filter(Boolean);
  const cuisineLabel = cuisineTags.length > 0 ? cuisineTags.join(' / ') : 'Global';

  // Inject Health Goals
  const { healthGoals } = useAppStore.getState();
  const calTarget = healthGoals?.calories ? `MAX CALORIES PER SERVING: ${healthGoals.calories}` : '';
  const glucoseTarget = healthGoals?.glucoseTarget ? `GLUCOSE TARGET: ${healthGoals.glucoseTarget} mg/dL (Avoid high glycemic index ingredients, sugars, and simple carbs strictly)` : '';

  if (!isValidApiKey) {
    console.warn('[AI] No valid Gemini API Key found (must start with AIzaSy). Returning mock recipe.');
    return {
      title: `Homemade ${cuisineLabel} ${dishName || 'Special'}`,
      description: `A delicious, easy-to-follow recipe for cooking a flavorful ${dishName} at home.`,
      time: '35 mins',
      calories: healthGoals?.calories || 520,
      tags: ['Easy Home Recipe', 'Chef Choice', ...dietaryRestrictions],
      ingredients: isArray ? ingredients : [dishName, 'Fresh vegetables', 'Cooking oil', 'Pinch of salt'],
      instructions: [
        `Step 1: Getting Ready. Wash and chop the ${dishName} and other ingredients.`,
        'Step 2: Preparing the pan. Heat 1 tbsp of cooking oil in a pan over medium heat.',
        'Step 3: Cooking. Add the main ingredients to the pan and cook until they are nice and golden-brown.',
        'Step 4: Simmering. Let all the ingredients simmer together on low heat for a few minutes.',
        'Step 5: Serving. Garnish with a handful of fresh herbs (like parsley or coriander) and enjoy hot.',
      ],
    };
  }

  const prompt = `Act as an expert world-class Michelin-star chef.
Generate a hyper-detailed, professional recipe based on this: ${ingredientString}.

CUISINE STYLE: ${cuisineLabel}${cuisineTags.length > 1 ? ' (blend authentic techniques and flavors from all of these cuisine traditions)' : ''}.
DIETARY RESTRICTIONS TO ADHERE TO: ${restrictionsStr}.
${calTarget}
${glucoseTarget}

CRITICAL REQUIREMENTS:
1. The recipe MUST strictly follow the dietary restrictions and health targets mentioned.
2. Every component mentioned MUST be explicitly mentioned in the instructions at the exact stage they are added.
3. Instructions must be granular and technical (e.g., mention specific heat levels, internal temperatures, and textures like 'until translucent' or 'until a deep golden brown').
4. Include specific times for each step and sensory cues (smell, color changes).
5. Do not skip any intermediate processes like mise-en-place, deglazing, resting times, or professional plate presentation.

You must format your response strictly as a JSON object with the following schema:
{
  "title": "Recipe Title",
  "description": "A short, engaging description",
  "time": "XX mins",
  "calories": 450,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["Detailed step 1", "Detailed step 2"]
}
Do not include any markdown formatting or extra text outside the JSON block.`;

  try {
    let responseText = await safeGenerateContent(prompt);

    // Strip markdown code fences if present
    if (responseText.includes('```json')) {
      responseText = responseText.split('```json')[1].split('```')[0];
    } else if (responseText.includes('```')) {
      responseText = responseText.split('```')[1].split('```')[0];
    }

    return JSON.parse(responseText.trim());
  } catch (error) {
    console.error('[AI] Error generating recipe:', error);
    throw error;
  }
};

// ─── generateWeeklyPlan ───────────────────────────────────────────────────────

const MOCK_WEEKLY_PLAN = () => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const breakfasts = ['Avocado Toast & Poached Eggs', 'Greek Yogurt Parfait', 'Overnight Oats', 'Banana Pancakes', 'Smoothie Bowl', 'Shakshuka', 'Smoked Salmon Bagel'];
  const lunches = ['Mediterranean Quinoa Bowl', 'Thai Peanut Noodle Salad', 'Caprese Panini', 'Lentil Soup', 'Chicken Caesar Wrap', 'Poke Bowl', 'Veggie Burrito'];
  const dinners = ['Herb-Crusted Salmon', 'Mushroom Risotto', 'Chicken Tikka Masala', 'Beef Stir-Fry', 'Pasta Primavera', 'Lamb Chops', 'Vegetable Curry'];

  const mockPlan = {};
  days.forEach((day, i) => {
    mockPlan[day] = {
      breakfast: [{
        id: Math.random(), title: breakfasts[i], time: '15 mins', calories: '350',
        tags: ['Healthy', 'Quick'], ingredients: ['Oats', 'Fresh Fruit', 'Honey', 'Nuts', 'Milk'],
        instructions: ['Prepare ingredients.', 'Combine and mix well.', 'Serve fresh.'],
        img: `https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400`
      }],
      lunch: [{
        id: Math.random(), title: lunches[i], time: '25 mins', calories: '480',
        tags: ['Balanced', 'Fresh'], ingredients: ['Greens', 'Protein', 'Grain', 'Dressing', 'Veggies'],
        instructions: ['Cook the base ingredients.', 'Assemble components.', 'Dress and serve.'],
        img: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400`
      }],
      dinner: [{
        id: Math.random(), title: dinners[i], time: '40 mins', calories: '620',
        tags: ['Signature', 'Protein-Rich'], ingredients: ['Main protein', 'Herbs', 'Vegetables', 'Sauce', 'Side grain'],
        instructions: ['Marinate and prep protein.', 'Cook with aromatics.', 'Build sauce and finish.', 'Rest and plate elegantly.'],
        img: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400`
      }],
    };
  });
  return mockPlan;
};

export const generateWeeklyPlan = async (dietaryRestrictions = [], cuisinePreference = 'Global', savedRecipes = []) => {
  try {
    let qb = supabase.from('recipes').select('*');
    
    const isGF = dietaryRestrictions.some(r => /gluten/i.test(r));
    const isVeg = dietaryRestrictions.some(r => /veget/i.test(r));
    const isVegan = dietaryRestrictions.some(r => /vegan/i.test(r));

    const applyFilters = (queryBuilder) => {
      let q = queryBuilder;
      if (isVegan) q = q.eq('is_vegan', true);
      else if (isVeg) q = q.eq('is_vegetarian', true);
      if (isGF) q = q.eq('is_gluten_free', true);
      if (cuisinePreference && cuisinePreference !== 'Global' && cuisinePreference !== 'Surprise Me') {
        q = q.ilike('cuisine', `%${cuisinePreference}%`);
      }
      return q;
    };

    // 1. Fetch Breakfasts specifically
    const breakfastKeywords = ['breakfast', 'pancake', 'waffle', 'omelet', 'egg', 'toast', 'porridge', 'upma', 'poha', 'idli', 'dosa', 'chila', 'paratha', 'muffin', 'crepe', 'bagel', 'shakshuka', 'frittata', 'granola'];
    const bfastOr = breakfastKeywords.map(k => `dish_name.ilike.%${k}%,description.ilike.%${k}%`).join(',');
    let bfastQb = applyFilters(supabase.from('recipes').select('*').or(bfastOr).limit(100));

    // 2. Fetch general pool for Lunch and Dinner
    let generalQb = applyFilters(supabase.from('recipes').select('*').limit(400));

    const [bfastRes, generalRes] = await Promise.all([bfastQb, generalQb]);

    let rawBreakfasts = bfastRes.data || [];
    let rawGeneral = generalRes.data || [];

    // Fallbacks if not enough data
    if (rawBreakfasts.length < 7) {
      const fallbackBfast = await applyFilters(supabase.from('recipes').select('*').or(bfastOr).limit(50));
      rawBreakfasts = [...rawBreakfasts, ...(fallbackBfast.data || [])];
    }
    if (rawGeneral.length < 14) {
      const fallbackGeneral = await applyFilters(supabase.from('recipes').select('*').limit(200));
      rawGeneral = [...rawGeneral, ...(fallbackGeneral.data || [])];
    }

    // Categorize and filter
    const breakfasts = [];
    const lunches = [];
    const dinners = [];
    const generic = [];
    
    // Dessert, Drink & Condiment blocker (much stricter now)
    const excludeRegex = /cake|cookie|biscuit|ice cream|dessert|sweet|chocolate|pudding|roshogolla|gulab jamun|laddu|barfi|halwa|kheer|tart|pie|brownie|mousse|truffle|macaron|pastry|candy|fudge|confection|jalebi|rasgulla|lassi|smoothie|shake|juice|drink|beverage|cocktail|mocktail|sherbet|syrup|nectar|compote|jam|pickle|achaar|chutney|sauce|dip|salsa|dressing|condiment|spice mix|paste|marinade/i;

    // Process dedicated breakfasts
    rawBreakfasts.forEach(recipe => {
      if (recipe.total_time_min && recipe.total_time_min > 240) return; // Skip things that take > 4 hours to make
      const text = (recipe.dish_name + ' ' + (recipe.description || '')).toLowerCase();
      if (!excludeRegex.test(text)) breakfasts.push(recipe);
    });

    // Process general pool
    rawGeneral.forEach(recipe => {
      if (recipe.total_time_min && recipe.total_time_min > 300) return; // Skip things that take > 5 hours to make
      const text = (recipe.dish_name + ' ' + (recipe.description || '') + ' ' + (recipe.cuisine || '')).toLowerCase();
      if (excludeRegex.test(text)) return;
      
      // Strict Health Filtering
      const { healthGoals } = useAppStore.getState();
      if (healthGoals?.calories && recipe.calories > Number(healthGoals.calories)) return; // Exclude meals that exceed total daily alone
      if (healthGoals?.glucoseTarget && /pasta|rice|bread|potato|sugar|honey/i.test(text)) return; // Very aggressive filter for glucose monitoring demo
      
      const isLunch = /salad|soup|sandwich|wrap|burger|taco|roll|light|bowl/i.test(text);
      if (isLunch) lunches.push(recipe);
      else generic.push(recipe);
    });
    
    // Shuffle arrays
    breakfasts.sort(() => 0.5 - Math.random());
    lunches.sort(() => 0.5 - Math.random());
    generic.sort(() => 0.5 - Math.random());
    
    // Fill lunches
    while (lunches.length < 7 && generic.length > 0) { lunches.push(generic.pop()); }
    
    // Dinners get whatever is left in generic
    dinners.push(...generic);
    dinners.sort(() => 0.5 - Math.random());
    
    // Final check for 7 items each. If still short, just clone items to avoid crashing.
    const finalBreakfasts = breakfasts.length >= 7 ? breakfasts.slice(0, 7) : [...breakfasts, ...breakfasts, ...breakfasts, ...rawGeneral].slice(0, 7);
    const finalLunches = lunches.length >= 7 ? lunches.slice(0, 7) : [...lunches, ...lunches, ...lunches, ...rawGeneral].slice(0, 7);
    const finalDinners = dinners.length >= 7 ? dinners.slice(0, 7) : [...dinners, ...dinners, ...dinners, ...rawGeneral].slice(0, 7);

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const plan = {};
    let dayIndex = 0;

    days.forEach(day => {
      plan[day] = { breakfast: [], lunch: [], dinner: [] };
      
      const processRecipe = (recipe, mealType) => {
        if (!recipe) return;
        const tags = [recipe.cuisine || 'Global', recipe.difficulty || 'Medium'];
        if (recipe.is_vegan) tags.push('Vegan');
        else if (recipe.is_vegetarian) tags.push('Vegetarian');

        let ingredientsArray = [];
        if (recipe.full_ingredients) {
          ingredientsArray = recipe.full_ingredients.split('\n').map(s => s.trim()).filter(Boolean);
        } else if (recipe.key_ingredients) {
          ingredientsArray = recipe.key_ingredients.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          ingredientsArray = ['Main ingredients', 'Spices', 'Herbs'];
        }

        let instructionsArray = [];
        if (recipe.detailed_recipe) {
          instructionsArray = recipe.detailed_recipe.split('\n').filter(s => s.trim().length > 0 && /^(STEP|\d+\.)/i.test(s)).map(s => s.trim());
          if (instructionsArray.length === 0) {
             instructionsArray = recipe.detailed_recipe.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 5);
          }
        } else {
          instructionsArray = ['Prepare ingredients.', 'Cook according to traditional methods.', 'Serve warm.'];
        }

        plan[day][mealType].push({
          id: recipe.id,
          title: recipe.dish_name,
          time: `${recipe.total_time_min || 30} mins`,
          calories: String(recipe.calories || Math.floor(Math.random() * 300) + 300),
          tags: tags,
          ingredients: ingredientsArray,
          instructions: instructionsArray,
          img: recipe.image_url || null
        });
      };
      
      processRecipe(finalBreakfasts[dayIndex], 'breakfast');
      processRecipe(finalLunches[dayIndex], 'lunch');
      processRecipe(finalDinners[dayIndex], 'dinner');
      dayIndex++;
    });

    return plan;
  } catch (err) {
    console.error('Error generating DB plan:', err);
    return MOCK_WEEKLY_PLAN();
  }
};
