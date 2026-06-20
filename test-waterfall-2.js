import fetch from 'node-fetch';

const fetchWikipediaImage = async (dishName) => {
  try {
    let cleanName = dishName.replace(/\([^)]*\)/g, '').trim();
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&utf8=&format=json&origin=*`);
    const searchData = await searchRes.json();
    
    if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
      const bestTitle = searchData.query.search[0].title;
      const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(bestTitle)}&origin=*`);
      const imgData = await imgRes.json();
      
      if (imgData.query && imgData.query.pages) {
        const pages = Object.values(imgData.query.pages);
        if (pages.length > 0 && pages[0].original && pages[0].original.source) {
          const url = pages[0].original.source;
          if (url.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i)) {
            return url;
          }
        }
      }
    }
  } catch (err) {}
  return null;
};

const UNSPLASH_ACCESS_KEY = 'szZRFZU4LNeNAiITrvyhB_msKQUwy2JDvtSlLlu2f8s';
const fetchUnsplashImage = async (dishName) => {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food')}&per_page=1&orientation=landscape`;
    let response = await fetch(url, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    if (response.ok) {
      let data = await response.json();
      if (data.results && data.results.length > 0) return data.results[0].urls.regular;
    }

    url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName)}&per_page=1&orientation=landscape`;
    response = await fetch(url, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    if (response.ok) {
      let data = await response.json();
      if (data.results && data.results.length > 0) return data.results[0].urls.regular;
    }
  } catch (err) {}
  return null;
};

const test = async () => {
  for (let dish of ['Sausage and Egg Croissant', 'Chivito', 'Saoji Mutton']) {
    console.log(`\nTesting ${dish}...`);
    let wiki = await fetchWikipediaImage(dish);
    console.log(`Wikipedia: ${wiki}`);
    let unsplash = await fetchUnsplashImage(dish);
    console.log(`Unsplash: ${unsplash}`);
  }
};

test();
