require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const imageMap = {
  curry: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  rice: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
  noodle: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
  meat: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80',
  chicken: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  drink: 'https://images.unsplash.com/photo-1544145945-f904278409e4?w=800&q=80',
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  snack: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80',
  generic1: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  generic2: 'https://images.unsplash.com/photo-1495461199391-8c39ab674295?w=800&q=80',
  generic3: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  generic4: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&q=80',
};

function getBestImage(dishName, cuisine) {
  const text = (dishName + ' ' + (cuisine || '')).toLowerCase();
  if (text.includes('curry') || text.includes('masala') || text.includes('dal') || text.includes('paneer')) return imageMap.curry;
  if (text.includes('soup') || text.includes('stew') || text.includes('broth')) return imageMap.soup;
  if (text.includes('salad') || text.includes('greens') || text.includes('bowl')) return imageMap.salad;
  if (text.includes('rice') || text.includes('biryani') || text.includes('pulao')) return imageMap.rice;
  if (text.includes('pasta') || text.includes('spaghetti') || text.includes('macaroni')) return imageMap.pasta;
  if (text.includes('noodle') || text.includes('ramen') || text.includes('pho')) return imageMap.noodle;
  if (text.includes('bread') || text.includes('roti') || text.includes('naan') || text.includes('toast') || text.includes('sandwich')) return imageMap.bread;
  if (text.includes('cake') || text.includes('pie') || text.includes('tart') || text.includes('muffin')) return imageMap.cake;
  if (text.includes('dessert') || text.includes('sweet') || text.includes('halwa') || text.includes('ice cream')) return imageMap.dessert;
  if (text.includes('chicken') || text.includes('murgh')) return imageMap.chicken;
  if (text.includes('fish') || text.includes('salmon') || text.includes('prawn') || text.includes('shrimp')) return imageMap.fish;
  if (text.includes('meat') || text.includes('beef') || text.includes('pork') || text.includes('lamb') || text.includes('steak') || text.includes('kebab')) return imageMap.meat;
  if (text.includes('drink') || text.includes('juice') || text.includes('lassi') || text.includes('shake')) return imageMap.drink;
  if (text.includes('breakfast') || text.includes('pancake') || text.includes('waffle') || text.includes('egg') || text.includes('omelet')) return imageMap.breakfast;
  if (text.includes('snack') || text.includes('bite') || text.includes('fry') || text.includes('chips')) return imageMap.snack;
  
  // Hash the string to pick a deterministic generic image
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const generics = [imageMap.generic1, imageMap.generic2, imageMap.generic3, imageMap.generic4];
  return generics[Math.abs(hash) % generics.length];
}

async function run() {
  console.log("Fetching non-unsplash recipes...");
  
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, dish_name, cuisine, image_url')
    .not('image_url', 'is', null)
    .not('image_url', 'ilike', '%unsplash.com%');
    
  if (error) {
    console.error("Error fetching recipes:", error);
    return;
  }
  
  console.log(`Found ${recipes.length} non-Unsplash images to replace.`);
  
  let replacedCount = 0;
  
  // We can do this extremely fast since it's just DB updates, no API calls!
  // Batch them in chunks of 50 to avoid overloading supabase
  const chunkSize = 50;
  for (let i = 0; i < recipes.length; i += chunkSize) {
    const chunk = recipes.slice(i, i + chunkSize);
    const promises = chunk.map(recipe => {
      const newUrl = getBestImage(recipe.dish_name, recipe.cuisine);
      return supabase.from('recipes').update({ image_url: newUrl }).eq('id', recipe.id);
    });
    
    await Promise.all(promises);
    replacedCount += chunk.length;
    console.log(`Processed ${replacedCount}/${recipes.length}...`);
  }
  
  console.log(`\nDONE! Replaced ${replacedCount} images successfully.`);
}

run().catch(console.error);
