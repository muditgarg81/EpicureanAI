import { GoogleGenAI } from '@google/genai';

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

export const generateWeeklyPlan = async (dietaryRestrictions = [], cuisinePreference = 'Global') => {
  const restrictionsStr = dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None';

  if (!isValidApiKey) {
    console.warn('[AI] No valid Gemini API Key found (must start with AIzaSy). Returning mock weekly plan.');
    return MOCK_WEEKLY_PLAN();
  }

  const prompt = `Act as a Michelin-star chef and expert nutritionist. 
Generate a complete 7-day meal plan for a household with these dietary restrictions: ${restrictionsStr}.
The cuisine style should be: ${cuisinePreference}.

Provide 3 meals per day: breakfast, lunch, and dinner.
Each meal MUST include:
1. A catchy title.
2. Prep time (e.g., '25 mins').
3. Calories as a string (e.g., '450').
4. 2-3 relevant tags as an array.
5. A list of 5-8 primary ingredients as an array.
6. A list of 3-4 professional cooking instructions as an array.

Format your response strictly as a JSON object with this structure:
{
  "MON": {
    "breakfast": [{"title": "...", "time": "...", "calories": "...", "tags": [...], "ingredients": [...], "instructions": [...]}],
    "lunch": [...],
    "dinner": [...]
  },
  "TUE": { ... },
  "WED": { ... },
  "THU": { ... },
  "FRI": { ... },
  "SAT": { ... },
  "SUN": { ... }
}
Ensure the JSON is valid and contains NO extra text outside the JSON block.`;

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
    console.error('[AI] Error generating weekly plan, using fallback mock:', error);
    // Always return something useful so the button never fails silently
    return MOCK_WEEKLY_PLAN();
  }
};
