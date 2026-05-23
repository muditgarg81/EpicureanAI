// src/services/unsplashService.js
import { supabase } from './supabaseClient';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const CACHE_KEY = 'epicurean_unsplash_cache_v4'; // Incrementing cache key to clear old local data

/**
 * Gets a cached image URL if it exists
 */
const getCachedImage = (dishName) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const lowerName = dishName.toLowerCase().trim();
    if (cache[lowerName] && cache[lowerName].timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) {
      return cache[lowerName].url;
    }
  } catch (e) {
    console.warn('Error reading Unsplash cache', e);
  }
  return null;
};

/**
 * Saves an image URL to cache
 */
const saveToCache = (dishName, url) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[dishName.toLowerCase().trim()] = {
      url,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Error saving to Unsplash cache', e);
  }
};

/**
 * Fetches an image for a specific dish
 * @param {string} dishName - The name of the dish
 * @returns {Promise<string|null>} - The URL of the image or null
 */
export const fetchDishImageFromUnsplash = async (dishName) => {
  if (!dishName) return null;
  const cleanName = dishName.toLowerCase().trim();

  // 1. Check local cache (fastest)
  const cachedUrl = getCachedImage(cleanName);
  if (cachedUrl) return cachedUrl;

  // 2. Check Supabase 'dish_images' table (centralized database)
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
    console.warn('Supabase dish_images check failed:', dbError);
  }

  // 3. Fallback to Unsplash API if not found in database
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key is missing');
    return null;
  }

  try {
    // Only fetch 1 image, prioritize high quality and relevance
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishName + ' food dish')}&per_page=1&orientation=landscape`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular;
      saveToCache(cleanName, imageUrl);
      
      // 4. Save to Supabase 'dish_images' table for future users
      try {
        await supabase
          .from('dish_images')
          .insert([{ dish_name: cleanName, image_url: imageUrl, source: 'unsplash' }]);
      } catch (insertError) {
        console.warn('Failed to save to Supabase dish_images:', insertError);
      }

      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    return null;
  }
};
