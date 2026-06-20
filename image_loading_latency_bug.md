# Bug Report: Delayed Image Loading on Discovery Page

## Problem Description
Users are experiencing a significant delay (1-2 minutes) where generic placeholder images are displayed on the Discovery feed before the correct, distinct dish images finally load. This degrades the premium feel of the application.

## Root Cause Analysis
I have investigated the codebase and identified the source of this latency in the client-side image fetching logic.

When the `DiscoveryHome` page loads, it renders a list of `RecipeCard` components. If a recipe does not have a pre-populated `image_url` from the database, the card immediately falls back to a generic stock photo and triggers a `useEffect` to fetch the real image asynchronously using `getDishImageWaterfall()`.

**The `getDishImageWaterfall` function in `src/services/imageWaterfallService.js` is highly unoptimized for bulk loading:**
1. **N+1 Supabase Queries:** For every card missing an image, it makes a separate `supabase.from('dish_images')` call. 20 cards = 20 concurrent Supabase queries.
2. **Sequential API Waterfall:** If the image is not in Supabase, the function performs a sequential chain of external API calls: `Wikipedia` -> `Unsplash` -> `MealDB` -> `Spoonacular` -> `Pexels` -> `Pixabay`. 
3. **Connection Bottleneck:** Because these `fetch` requests are sequential (`await fetchWikipedia`, then `await fetchUnsplash`, etc.), a single image can take several seconds to resolve. When multiplied by 10-20 cards on the screen, the browser's connection pool is exhausted, and the external APIs may rate-limit the client, causing the 1-2 minute delay before the promises resolve and the React state updates with the final `unsplashImage`.

## Proposed Solutions

To restore the premium feel of the app, you should implement one or more of the following architectural changes:

### 1. Parallelize the Waterfall (Quick Fix)
Instead of `await`-ing each external API sequentially, use `Promise.any()` or `Promise.allSettled()` to fire the Wikipedia, Unsplash, Pexels, and Pixabay requests simultaneously. The first one to return a valid image URL wins. This will reduce the resolution time from ~10 seconds to ~1 second per image.

### 2. Batch Supabase Queries
Instead of having each `RecipeCard` individually query Supabase for its image, the `DiscoveryHome` page should extract all `dish_name`s that are missing images and make a **single** Supabase query using `.in('dish_name', [names])`. It can then pass the resolved URLs down to the cards as props.

### 3. Serverless Edge Function (Robust Fix)
Move the `imageWaterfallService` logic to a Supabase Edge Function. When the client needs an image, it hits the Edge Function. The Edge Function can execute the external API calls without being subject to browser connection limits or exposing API keys in the client bundle.

### 4. Wait for Background Job Completion (Data Fix)
The background AI image generation script is currently running. Once it finishes processing all 3,300+ recipes in the database, the `recipe.image_url` property will be populated immediately on load, bypassing the client-side waterfall entirely.

> **Recommendation for Claude:** Implement Solution #1 (Parallelizing the Waterfall with `Promise.any`) in `imageWaterfallService.js` to immediately fix the client-side lag for any missing images, while allowing the background AI script to continue populating the permanent database.
