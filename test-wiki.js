import fetch from 'node-fetch';

const fetchWikipediaImage = async (dishName) => {
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(dishName)}&origin=*`);
    const data = await res.json();
    if (data.query && data.query.pages) {
      const pages = Object.values(data.query.pages);
      if (pages.length > 0 && pages[0].original && pages[0].original.source) {
        const url = pages[0].original.source;
        if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg') || url.toLowerCase().endsWith('.png')) {
          return url;
        }
      }
    }
  } catch (err) {
    console.warn('[Wikipedia] Fetch failed:', err);
  }
  return null;
};

const fetchUnsplashImage = async (dishName) => {
  try {
    // Note: I don't have access to the VITE_UNSPLASH_ACCESS_KEY here easily.
    // I will mock it.
  } catch (e) {}
}

async function test() {
  const dishes = ['Tortilla (Corn)', 'Ciorbă de Burtă', 'Memoni Biryani'];
  for (const dish of dishes) {
    console.log(`Testing Wikipedia for: ${dish}`);
    const url = await fetchWikipediaImage(dish);
    console.log(`Result: ${url}`);
  }
}

test();
