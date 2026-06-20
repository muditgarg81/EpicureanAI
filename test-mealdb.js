import fetch from 'node-fetch';

const searchMealDB = async (query) => {
  try {
    const term = encodeURIComponent(query.split(' ')[0]); // use first word for better match
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`);
    const data = await res.json();
    if (data.meals && data.meals.length > 0) {
      return data.meals[0].strMealThumb;
    }
  } catch (err) {
    console.warn('[MealDB] Fetch failed:', err);
  }
  return null;
};

async function test() {
  const dishes = ['Tortilla (Corn)', 'Ciorbă de Burtă', 'Memoni Biryani'];
  for (const dish of dishes) {
    console.log(`Testing MealDB for: ${dish}`);
    const url = await searchMealDB(dish);
    console.log(`Result: ${url}`);
  }
}

test();
