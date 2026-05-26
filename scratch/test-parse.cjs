const TIME_WORDS = new Set(['min', 'mins', 'minute', 'minutes', 'hour', 'hours', 'hr', 'hrs', 'sec', 'secs']);
const STOP_WORDS  = new Set([
  'i', 'have', 'got', 'want', 'a', 'an', 'the', 'and', 'or', 'with', 'some',
  'make', 'cook', 'prepare', 'need', 'using', 'use', 'can', 'me', 'something',
  'what', 'how', 'find', 'show', 'about', 'for', 'of', 'in', 'to', 'only', 'just',
  'something', 'anything', 'please', 'help', 'quick', 'fast', 'easy', 'simple',
  'recipes', 'recipe', 'dishes', 'dish', 'meals', 'meal', 'cuisine', 'cuisines',
  'world', 'global', 'under', 'above', 'spicy', 'spice', 'hot', 'food',
  'vegetarian', 'vegan', 'gluten', 'dairy', 'recipes', 'recipe', 'meals', 'meal', 'dishes', 'dish', 'cuisine', 'quick', 'easy', 'diet', 'dietary'
]);

function parseQuery(text) {
  const lower = text.toLowerCase();

  const timeMatch = lower.match(/(\d+)\s*(?:min|mins|minute|minutes)/);
  const maxTime   = timeMatch ? parseInt(timeMatch[1], 10) : null;

  const dietary = {
    vegan:       /\bvegan\b/.test(lower),
    vegetarian:  /\bvegetarian\b/.test(lower),
    glutenFree:  /\bgluten.?free\b/.test(lower),
    dairyFree:   /\bdairy.?free\b/.test(lower),
    keto:        /\bketo\b/.test(lower),
    spicy:       /\b(spicy|spice|hot)\b/.test(lower),
  };

  const tokens = lower
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t) && !TIME_WORDS.has(t) && !/^\d+$/.test(t));

  return { ingredients: [...new Set(tokens)], maxTime, dietary };
}

console.log("vegetarian recipes:", parseQuery("vegetarian recipes"));
console.log("quick meals under 20 mins:", parseQuery("quick meals under 20 mins"));
