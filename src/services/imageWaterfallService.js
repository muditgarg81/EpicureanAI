// src/services/imageWaterfallService.js
import { supabase } from './supabaseClient';
import { searchMealDB, searchSpoonacular } from './externalRecipeService';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const CACHE_KEY = 'epicurean_waterfall_cache_v1';

const getCachedImage = (dishName) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const lowerName = dishName.toLowerCase().trim();
    if (cache[lowerName] && cache[lowerName].timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) {
      return cache[lowerName].url;
    }
  } catch (e) {
    console.warn('Error reading cache', e);
  }
  return null;
};

const saveToCache = (dishName, url) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[dishName.toLowerCase().trim()] = { url, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Error saving to cache', e);
  }
};

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
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food dish')}&per_page=1&orientation=landscape`;
    const response = await fetch(url, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (err) {
    console.warn('[Unsplash] Fetch failed:', err);
  }
  return null;
};

export const getDishImageWaterfall = async (dishName) => {
  if (!dishName) return null;
  const cleanName = dishName.toLowerCase().trim();

  // 1. Check local cache
  const cachedUrl = getCachedImage(cleanName);
  if (cachedUrl) return cachedUrl;

  // 2. Check Supabase
  try {
    const { data, error } = await supabase
      .from('dish_images')
      .select('image_url')
      .eq('dish_name', cleanName)
      .single();

    if (data && data.image_url) {
      saveToCache(cleanName, data.image_url);
      return data.image_url;
    }
  } catch (dbError) {
    // Ignore error, continue waterfall
  }

  // 3. Waterfall: Wikipedia -> Unsplash -> MealDB -> Spoonacular
  let finalUrl = null;
  let source = null;

  // Try Wikipedia
  finalUrl = await fetchWikipediaImage(dishName);
  source = 'wikipedia';

  // Try Unsplash
  if (!finalUrl) {
    finalUrl = await fetchUnsplashImage(dishName);
    source = 'unsplash';
  }

  // Try MealDB
  if (!finalUrl) {
    const meals = await searchMealDB(dishName);
    if (meals && meals.length > 0 && meals[0].thumbnail) {
      finalUrl = meals[0].thumbnail;
      source = 'mealdb';
    }
  }

  // Try Spoonacular
  if (!finalUrl) {
    const spoons = await searchSpoonacular(dishName, 1);
    if (spoons && spoons.length > 0 && spoons[0].thumbnail) {
      finalUrl = spoons[0].thumbnail;
      source = 'spoonacular';
    }
  }

  // 4. Save successful result to DB and Cache
  if (finalUrl) {
    saveToCache(cleanName, finalUrl);
    try {
      await supabase
        .from('dish_images')
        .insert([{ dish_name: cleanName, image_url: finalUrl, source: source }]);
    } catch (insertError) {
      // Ignore
    }
    return finalUrl;
  }

  return null;
};
