import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabaseClient';

// Initialize the @google/genai v2 SDK.
// v2 API: ai.models.generateContent({ model, contents })
const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
// Google Gemini API keys are standard GCP keys and always start with the AIzaSy prefix.
const isValidApiKey = typeof rawApiKey === 'string' && rawApiKey.trim().startsWith('AIzaSy');

const ai = new GoogleGenAI({
  apiKey: isValidApiKey ? rawApiKey.trim() : 'PLACEHOLDER_KEY',
});

/**
 * safeGenerateContent
 * Calls the correct @google/genai v2 method and tries a fallback chain of models.
 * @param {string} prompt
 * @param {string} primaryModel
 * @returns {Promise<string>} raw text response
 */
const safeGenerateContent = async (prompt, primaryModel = 'gemini-2.5-flash') => {
  // Ordered list of models to try: primary first, then fallbacks
  const modelsToTry = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
  ];
  // Deduplicate while preserving order
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError;
  for (const model of uniqueModels) {
    try {
      console.log(`[AI] Trying model: ${model}`);
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      // @google/genai v2 returns result.text directly
      return result.text;
    } catch (error) {
      console.warn(`[AI] Model "${model}" failed:`, error.message);
      lastError = error;
      // Don't retry on auth errors
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

  if (!isValidApiKey) {
    console.warn('[AI] No valid Gemini API Key found (must start with AIzaSy). Returning mock recipe.');
    return {
      title: `Homemade ${cuisine} ${dishName || 'Special'}`,
      description: `A delicious, easy-to-follow recipe for cooking a flavorful ${dishName} at home.`,
      time: '35 mins',
      calories: 520,
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
Generate a hyper-detailed, professional ${cuisine} recipe based on this: ${ingredientString}. 

DIETARY RESTRICTIONS TO ADHERE TO: ${restrictionsStr}.

CRITICAL REQUIREMENTS:
1. The recipe MUST strictly follow the dietary restrictions mentioned.
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
    
    const isVegan = dietaryRestrictions.some(r => /vegan/i.test(r));
    const isVeg = dietaryRestrictions.some(r => /vegetarian/i.test(r));
    const isGF = dietaryRestrictions.some(r => /gluten/i.test(r));

    if (isVegan) qb = qb.eq('is_vegan', true);
    else if (isVeg) qb = qb.eq('is_vegetarian', true);
    if (isGF) qb = qb.eq('is_gluten_free', true);
    
    // Attempt to match cuisine if not generic
    if (cuisinePreference && cuisinePreference !== 'Global' && cuisinePreference !== 'Surprise Me') {
      qb = qb.ilike('cuisine', `%${cuisinePreference}%`);
    }

    let { data, error } = await qb.limit(300);
    
    if (error || !data || data.length < 21) {
      // Fallback: relax constraints if not enough data
      let fallbackQb = supabase.from('recipes').select('*').limit(300);
      if (isVegan) fallbackQb = fallbackQb.eq('is_vegan', true);
      else if (isVeg) fallbackQb = fallbackQb.eq('is_vegetarian', true);
      
      const fallback = await fallbackQb;
      data = fallback.data || [];
      
      if (data.length < 21) {
         // Final fallback: fetch anything
         const final = await supabase.from('recipes').select('*').limit(100);
         data = final.data || [];
      }
    }

    // Shuffle the pool
    let pool = data.sort(() => 0.5 - Math.random());
    
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const plan = {};
    let recipeIndex = 0;

    days.forEach(day => {
      plan[day] = { breakfast: [], lunch: [], dinner: [] };
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        const recipe = pool[recipeIndex % pool.length];
        recipeIndex++;
        
        if (!recipe) return; // safety

        const tags = [recipe.cuisine || 'Global', recipe.difficulty || 'Medium'];
        if (recipe.is_vegan) tags.push('Vegan');
        else if (recipe.is_vegetarian) tags.push('Vegetarian');

        // Extract ingredients properly
        let ingredientsArray = [];
        if (recipe.full_ingredients) {
          ingredientsArray = recipe.full_ingredients.split('\n').map(s => s.trim()).filter(Boolean);
        } else if (recipe.key_ingredients) {
          ingredientsArray = recipe.key_ingredients.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          ingredientsArray = ['Main ingredients', 'Spices', 'Herbs'];
        }

        // Extract instructions properly
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
          img: recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
        });
      });
    });

    return plan;
  } catch (err) {
    console.error('Error generating DB plan:', err);
    return MOCK_WEEKLY_PLAN();
  }
};
