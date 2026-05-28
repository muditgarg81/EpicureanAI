# Implement Unified Image Waterfall System

The goal of this plan is to restructure the application's image fetching logic to strictly follow the finalized action plan's hierarchy for dynamic image sourcing:
1. Wikipedia API (.jpg)
2. Unsplash API (Backup)
3. TheMealDB API (Backup)
4. Spoonacular API (Backup)

Currently, the app relies on the database's pre-imported Wikipedia links, and if missing, it jumps straight to Unsplash via `unsplashService.js`. The external recipe services (MealDB/Spoonacular) are only used if the user specifically opens the AI Recipe Generator or searches for them, but not as image fallbacks for standard Discovery recipes.

## Proposed Changes

### 1. Create `src/services/imageWaterfallService.js`
Create a new service that unifies image fetching. It will take a dish name and run through the following waterfall sequence:
- **Cache Check:** Check localStorage and the Supabase `dish_images` table.
- **Wikipedia API:** Query `en.wikipedia.org/w/api.php` for `pageimages`. If a valid `.jpg` or `.png` is found, return and cache it.
- **Unsplash API:** If Wikipedia fails, call the existing Unsplash logic.
- **TheMealDB API:** If Unsplash fails (e.g., rate limit), query `searchMealDB` to see if TheMealDB has a thumbnail for this dish.
- **Spoonacular API:** If MealDB fails, query `searchSpoonacular` for a thumbnail.
- **Caching:** Whenever any of the 4 APIs successfully return a valid image URL, the system will save that URL back to the Supabase `dish_images` table so the waterfall doesn't need to run again for future users.

### 2. Update Components
#### [MODIFY] `src/pages/DiscoveryHome.jsx`
Update the `RecipeCard` component to use the new `imageWaterfallService` instead of calling `fetchDishImageFromUnsplash` directly.

#### [MODIFY] `src/pages/DetailedRecipeView.jsx`
Apply the same unified waterfall logic if the detailed view is missing an image.

#### [MODIFY] `src/pages/Favorites.jsx`
Apply the same unified waterfall logic.

## Verification Plan
1. Clear the local cache and Supabase `dish_images` for a specific test dish (e.g., "Lachha Paratha").
2. Ensure the app first queries Wikipedia for the image.
3. Pass a nonsense dish name to Wikipedia to force a fallback to Unsplash.
4. Disable the Unsplash API key temporarily to force a fallback to MealDB/Spoonacular and verify images are correctly populated from those sources.

## User Review Required
> [!IMPORTANT]  
> Are you happy with this waterfall approach? Currently, some database entries have old Google Image Search links (which act as broken images). As part of this implementation, I can also write a quick database script to clear out those old Google links so the new Wikipedia waterfall can properly take over. Let me know if you approve this plan!
