import fetch from 'node-fetch';

const fetchWikipediaImageSmart = async (dishName) => {
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
  } catch (err) {
    console.warn('[Wikipedia Smart] Fetch failed:', err);
  }
  return null;
};

async function test() {
  const dishes = ['Çılbır', 'Mangalore Buns', 'Chivito'];
  for (const dish of dishes) {
    console.log(`\nTesting: ${dish}`);
    console.log(`Wiki URL: ${await fetchWikipediaImageSmart(dish)}`);
  }
}

test();
