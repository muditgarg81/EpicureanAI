require('dotenv').config();

const UNSPLASH_ACCESS_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.VITE_PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.VITE_PIXABAY_API_KEY;

const dishName = "Lassi (Salted)";

async function run() {
  console.log(`Testing APIs for dish: "${dishName}"\n`);
  
  // Clean name
  const searchName = dishName.replace(/\([^)]*\)/g, '').trim();
  const words = searchName.split(/\s+/);
  let optimizedSearchName = searchName;
  if (words.length > 1) {
    const baseDish = words.pop();
    const variations = words.join(' ');
    optimizedSearchName = `${baseDish} ${variations}`;
  }
  
  console.log(`Original Name: ${dishName}`);
  console.log(`Cleaned Name: ${searchName}`);
  console.log(`Optimized Search Name: ${optimizedSearchName}\n`);

  // 1. Wikipedia
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchName)}&utf8=&format=json&origin=*`);
    const data = await res.json();
    let url = null;
    if (data.query?.search?.length > 0) {
      const bestTitle = data.query.search[0].title;
      const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(bestTitle)}&origin=*`);
      const imgData = await imgRes.json();
      const pages = Object.values(imgData.query.pages);
      if (pages.length > 0 && pages[0].original?.source) {
        url = pages[0].original.source;
      }
    }
    console.log(`[Wikipedia]: ${url || 'Not Found'}`);
  } catch (e) {
    console.log(`[Wikipedia] Error: ${e.message}`);
  }

  // 2. Unsplash
  try {
    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(optimizedSearchName + ' food')}&per_page=1&orientation=landscape`;
    let res = await fetch(url, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    let data = await res.json();
    let imgUrl = null;
    if (data.results?.length > 0) {
      imgUrl = data.results[0].urls.regular;
    } else {
      url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(optimizedSearchName)}&per_page=1&orientation=landscape`;
      res = await fetch(url, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
      data = await res.json();
      if (data.results?.length > 0) imgUrl = data.results[0].urls.regular;
    }
    console.log(`[Unsplash]: ${imgUrl || 'Not Found'}`);
  } catch (e) {
    console.log(`[Unsplash] Error: ${e.message}`);
  }

  // 3. MealDB
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(optimizedSearchName)}`);
    const data = await res.json();
    console.log(`[MealDB]: ${data.meals?.[0]?.strMealThumb || 'Not Found'}`);
  } catch (e) {
    console.log(`[MealDB] Error: ${e.message}`);
  }

  // 4. Spoonacular
  try {
    console.log(`[Spoonacular]: Skipping (rate limits, usually similar to mealdb/unsplash)`);
  } catch (e) {}

  // 5. Pexels
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(optimizedSearchName + ' food')}&per_page=1&orientation=landscape`, {
      headers: { 'Authorization': PEXELS_API_KEY }
    });
    const data = await res.json();
    console.log(`[Pexels]: ${data.photos?.[0]?.src?.large || data.photos?.[0]?.src?.original || 'Not Found'}`);
  } catch (e) {
    console.log(`[Pexels] Error: ${e.message}`);
  }

  // 6. Pixabay
  try {
    const res = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_API_KEY)}&q=${encodeURIComponent(optimizedSearchName + ' food')}&image_type=photo&per_page=3&orientation=horizontal`);
    const data = await res.json();
    console.log(`[Pixabay]: ${data.hits?.[0]?.largeImageURL || data.hits?.[0]?.webformatURL || 'Not Found'}`);
  } catch (e) {
    console.log(`[Pixabay] Error: ${e.message}`);
  }
}

run();
