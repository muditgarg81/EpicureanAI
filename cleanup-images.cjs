require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function isImageValid(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) return true;
      // Some services don't return accurate content-type on HEAD, but if it's 200 OK we'll assume it's good
      return true;
    }
    // If HEAD fails (some servers block HEAD), try a quick GET
    const getRes = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-100', 'User-Agent': 'Mozilla/5.0' } });
    if (getRes.ok) return true;
    return false;
  } catch (err) {
    return false; // Network error or DNS failure
  }
}

async function fetchWikipediaImage(searchName) {
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

async function fetchUnsplashImage(searchName) {
  try {
    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchName + ' food')}&per_page=1&orientation=landscape`;
    let response = await fetch(url, { headers: { 'Authorization': `Client-ID ${process.env.VITE_UNSPLASH_ACCESS_KEY}` } });
    if (response.ok) {
      let data = await response.json();
      if (data.results && data.results.length > 0) return data.results[0].urls.regular;
    }
  } catch(e) {}
  return null;
}

async function fetchMealDBImage(searchName) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchName)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.meals && data.meals.length > 0) return data.meals[0].strMealThumb;
    }
  } catch (err) {}
  return null;
}

async function fetchSpoonacularImage(searchName) {
  try {
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(searchName)}&number=1&apiKey=${process.env.VITE_SPOONACULAR_API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) return data.results[0].image;
    }
  } catch (err) {}
  return null;
}

async function fetchPexelsImage(searchName) {
  if (!process.env.VITE_PEXELS_API_KEY) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchName + ' food')}&per_page=1&orientation=landscape`;
    const response = await fetch(url, { headers: { 'Authorization': process.env.VITE_PEXELS_API_KEY } });
    if (response.ok) {
      const data = await response.json();
      if (data.photos && data.photos.length > 0) return data.photos[0].src.large || data.photos[0].src.original;
    }
  } catch (err) {}
  return null;
}

async function fetchPixabayImage(searchName) {
  if (!process.env.VITE_PIXABAY_API_KEY) return null;
  try {
    const url = `https://pixabay.com/api/?key=${encodeURIComponent(process.env.VITE_PIXABAY_API_KEY)}&q=${encodeURIComponent(searchName + ' food')}&image_type=photo&per_page=3&orientation=horizontal`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.hits && data.hits.length > 0) return data.hits[0].largeImageURL || data.hits[0].webformatURL;
    }
  } catch (err) {}
  return null;
}

async function getNewImage(dishName) {
  const searchName = dishName.replace(/\([^)]*\)/g, '').trim();
  const words = searchName.split(/\s+/);
  let optimizedSearchName = searchName;
  if (words.length > 1) {
    const baseDish = words.pop();
    const variations = words.join(' ');
    optimizedSearchName = `${baseDish} ${variations}`;
  }

  let finalUrl = await fetchWikipediaImage(dishName); // Wikipedia uses the original name
  let source = 'wikipedia';

  if (!finalUrl) {
    finalUrl = await fetchUnsplashImage(optimizedSearchName);
    source = 'unsplash';
  }
  if (!finalUrl) {
    finalUrl = await fetchMealDBImage(optimizedSearchName);
    source = 'mealdb';
  }
  if (!finalUrl) {
    finalUrl = await fetchSpoonacularImage(optimizedSearchName);
    source = 'spoonacular';
  }
  if (!finalUrl) {
    finalUrl = await fetchPexelsImage(optimizedSearchName);
    source = 'pexels';
  }
  if (!finalUrl) {
    finalUrl = await fetchPixabayImage(optimizedSearchName);
    source = 'pixabay';
  }
  
  return { finalUrl, source };
}

async function run() {
  console.log('Fetching all images from Supabase...');
  const { data, error } = await supabase.from('dish_images').select('id, dish_name, image_url, source');
  if (error || !data) {
    console.error('Error fetching images', error);
    return;
  }
  console.log(`Found ${data.length} images to test.`);

  let fixCount = 0;
  let failCount = 0;
  let okCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    process.stdout.write(`[${i+1}/${data.length}] Testing ${row.dish_name}... `);
    const isValid = await isImageValid(row.image_url);
    
    if (isValid) {
      console.log('OK');
      okCount++;
    } else {
      console.log('BAD. Finding replacement...');
      const { finalUrl, source } = await getNewImage(row.dish_name);
      if (finalUrl) {
        console.log(`   -> Found replacement from ${source}: ${finalUrl}`);
        const { error: updateError } = await supabase
          .from('dish_images')
          .update({ image_url: finalUrl, source: source })
          .eq('id', row.id);
          
        if (updateError) {
          console.log(`   -> Failed to update db:`, updateError);
        } else {
          fixCount++;
        }
      } else {
        console.log(`   -> Could not find ANY replacement for ${row.dish_name}`);
        failCount++;
        // Delete the bad cache so it's fresh next time
        await supabase.from('dish_images').delete().eq('id', row.id);
      }
    }
    
    // Add a tiny delay to prevent rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\\n--- Summary ---');
  console.log(`Images OK: ${okCount}`);
  console.log(`Images Fixed: ${fixCount}`);
  console.log(`Images Deleted (No replacement found): ${failCount}`);
}

run();
