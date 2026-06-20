import fetch from 'node-fetch';
const UNSPLASH_ACCESS_KEY = 'szZRFZU4LNeNAiITrvyhB_msKQUwy2JDvtSlLlu2f8s';

const fetchUnsplashImage = async (dishName) => {
  try {
    const searchName = dishName.replace(/\([^)]*\)/g, '').trim();
    // Try first with "food" instead of "food dish", or just the name
    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchName + ' food')}&per_page=1&orientation=landscape`;
    let response = await fetch(url, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    let data = await response.json();
    if (data.results && data.results.length > 0) return data.results[0].urls.regular;

    url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchName)}&per_page=1&orientation=landscape`;
    response = await fetch(url, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    data = await response.json();
    if (data.results && data.results.length > 0) return data.results[0].urls.regular;

  } catch (err) {
    console.warn('[Unsplash] Fetch failed:', err);
  }
  return null;
};

async function test() {
  const dishes = ['Lassi (Banana)', 'Pomegranate Juice'];
  for (const dish of dishes) {
    console.log(`\nTesting: ${dish}`);
    console.log(`Unsplash URL: ${await fetchUnsplashImage(dish)}`);
  }
}

test();
