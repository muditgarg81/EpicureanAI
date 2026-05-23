const cleanIngredientName = (name) => {
  if (!name || typeof name !== 'string') return '';
  let clean = name.toLowerCase();
  
  // 1. Remove parentheses containing preparation details or extra info
  clean = clean.replace(/\([^)]*\)/g, '');
  
  // 2. Remove common unit words (both singular and plural) when they appear as words
  clean = clean.replace(/\b(cups|cup|tbsp|tsp|g|kg|ml|l|oz|lb|pcs|units|grams|gram|ounces|ounce|pounds|pound|large|small|medium|fresh|organic|pure|raw|dry|cold|warm|hot|of|optional|as needed|to taste)\b/gi, '');
  
  // 3. Remove preparation adjectives/verbs
  clean = clean.replace(/\b(boiled|mashed|grated|shredded|chopped|sliced|minced|melted|crushed|toasted|diced|peeled|cooked|steamed|powder|paste|pureed|shaved|beaten|fine|finely|coarse|coarsely|roasted|sifted|seeded|canned|frozen|halved|quartered|drained|packed|squeezed)\b/gi, '');

  // 4. Remove leading/trailing numbers, fractions, hyphens, pluses, slashes, and spaces
  clean = clean.replace(/^[\d\/\s\-\+\.]+/g, '');
  
  // 5. Clean up any double spaces, punctuation, and trim
  clean = clean.replace(/\s+/g, ' ').replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
  
  // 6. Title-case the clean ingredient name
  if (!clean) return '';
  return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const testIngredients = [
  "2 cups Whole Wheat Flour",
  "1 cup Potatoes (boiled, mashed)",
  "1 cup Cauliflower (grated)",
  "1 tsp Cumin",
  "1 tsp Amchur",
  "2 Green Chilies",
  "Ghee (as needed)",
  "1/2 cup finely chopped onions",
  "3 cloves of minced garlic",
  "1 tin of organic diced tomatoes",
  "fresh coriander leaves"
];

console.log("TESTING CLEANING:");
testIngredients.forEach(ing => {
  // Regex to split quantity and name
  const match = ing.match(/^([\d\/\s\-\.]+(?:cups?|tsps?|tbsps?|g|kg|ml|l|oz|lbs?|pcs|units?|large|small|medium|cloves?|tins?|cans?|pinches?|pinch)?)\s+(.*)$/i);
  const qty = match ? match[1].trim() : 'As needed';
  const name = match ? match[2].trim() : ing;
  const cleaned = cleanIngredientName(name);
  console.log(`Original: "${ing}" => Qty: "${qty}", Name: "${name}" => Cleaned Name: "${cleaned}"`);
});
