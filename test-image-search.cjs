require('dotenv').config({path: '.env.local'});

const dishName = "Palak Paneer";
const searchName = dishName.replace(/\([^)]*\)/g, '').trim();

const words = searchName.split(/\s+/);
let optimizedSearchName = searchName;
if (words.length > 1) {
  const baseDish = words.pop();
  const variations = words.join(' ');
  optimizedSearchName = `${baseDish} ${variations}`;
}

async function testWikipedia() {
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchName)}&utf8=&format=json&origin=*`);
    const searchData = await searchRes.json();
    if (searchData.query && searchData.query.search.length > 0) {
      const bestTitle = searchData.query.search[0].title;
      const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(bestTitle)}&origin=*`);
      const imgData = await imgRes.json();
      if (imgData.query && imgData.query.pages) {
        const pages = Object.values(imgData.query.pages);
        if (pages.length > 0 && pages[0].original && pages[0].original.source) {
          return pages[0].original.source;
        }
      }
    }
  } catch(e) {}
  return null;
}

async function testUnsplash() {
  try {
    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(optimizedSearchName + ' food')}&per_page=1&orientation=landscape`;
    let response = await fetch(url, { headers: { 'Authorization': `Client-ID ${process.env.VITE_UNSPLASH_ACCESS_KEY}` } });
    if (response.ok) {
      let data = await response.json();
      if (data.results && data.results.length > 0) return data.results[0].urls.regular;
    }
  } catch(e) {}
  return null;
}

async function testMealDB() {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(optimizedSearchName)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.meals && data.meals.length > 0) return data.meals[0].strMealThumb;
    }
  } catch (err) {}
  return null;
}

async function testSpoonacular() {
  try {
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(optimizedSearchName)}&number=1&apiKey=${process.env.VITE_SPOONACULAR_API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) return data.results[0].image;
    }
  } catch (err) {}
  return null;
}

async function testPexels() {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(optimizedSearchName + ' food')}&per_page=1&orientation=landscape`;
    const response = await fetch(url, { headers: { 'Authorization': process.env.VITE_PEXELS_API_KEY } });
    if (response.ok) {
      const data = await response.json();
      if (data.photos && data.photos.length > 0) return data.photos[0].src.large || data.photos[0].src.original;
    }
  } catch (err) {}
  return null;
}

async function testPixabay() {
  try {
    const url = `https://pixabay.com/api/?key=${encodeURIComponent(process.env.VITE_PIXABAY_API_KEY)}&q=${encodeURIComponent(optimizedSearchName + ' food')}&image_type=photo&per_page=3&orientation=horizontal`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.hits && data.hits.length > 0) return data.hits[0].largeImageURL || data.hits[0].webformatURL;
    }
  } catch (err) {}
  return null;
}

async function run() {
  console.log('Original Search:', searchName);
  console.log('Optimized Search:', optimizedSearchName);
  
  const wiki = await testWikipedia();
  console.log('WIKIPEDIA:', wiki);
  
  const unsplash = await testUnsplash();
  console.log('UNSPLASH:', unsplash);
  
  const mealdb = await testMealDB();
  console.log('MEALDB:', mealdb);
  
  const spoon = await testSpoonacular();
  console.log('SPOONACULAR:', spoon);
  
  const pexels = await testPexels();
  console.log('PEXELS:', pexels);
  
  const pixabay = await testPixabay();
  console.log('PIXABAY:', pixabay);
}

run();
