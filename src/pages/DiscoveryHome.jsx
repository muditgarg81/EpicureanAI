import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import useAppStore from '../store/useAppStore';
import { 
  getSpoonacularRecipe,
  lookupMealDBById
} from '../services/externalRecipeService';
import { culinaryDataBank, getDishImage, isStrictDishImage } from '../data/culinaryData';
import { getDishImageWaterfall } from '../services/imageWaterfallService';
import { getUnifiedSuggestions, getUnifiedFullSearch } from '../services/unifiedSearchService';

// Speech Recognition is imported dynamically inside handleVoiceSearch to support all web/native platforms

// ─── Image URL Sanitizer Helper ──────────────────────────────────────────────
const cleanImageUrl = (url) => {
  if (!url || typeof url !== 'string' || url.includes('google.com') || url.includes('loremflickr.com')) return null;
  if (!isStrictDishImage(url)) return null;
  return url;
};

// ─── Search Relevance Scoring Helper ──────────────────────────────────────────
const getSearchRelevanceScore = (recipe, queryText, queryTokens) => {
  if (!recipe || !queryText) return 0;
  const recipeName = recipe.dish_name || recipe.title || '';
  const nameLower = recipeName.toLowerCase().trim();
  const queryLower = queryText.toLowerCase().trim();

  // 1. Exact Match: 10,000 points
  if (nameLower === queryLower) {
    return 10000;
  }

  // 2. Starts-with Prefix Match: 5,000 points
  if (nameLower.startsWith(queryLower)) {
    return 5000;
  }

  // 3. Word Boundary Match: 2,000 points
  const wordBoundaryRegex = new RegExp(`\\b${queryLower}\\b`, 'i');
  if (wordBoundaryRegex.test(nameLower)) {
    return 2000;
  }

  // 4. Token Matching
  let score = 0;
  if (queryTokens && queryTokens.length > 0) {
    const nameWords = nameLower.split(/[\s,\(\)]+/);
    queryTokens.forEach(token => {
      const tokLower = token.toLowerCase();
      // Full word match: 500 points
      if (nameWords.includes(tokLower)) {
        score += 500;
      }
      // Substring word-prefix match (e.g. 'lass' matches 'lassi'): 200 points
      else if (nameWords.some(w => w.startsWith(tokLower))) {
        score += 200;
      }
      // Middle substring match (e.g. 'lassi' in 'classic'): only 10 points!
      else if (nameLower.includes(tokLower)) {
        score += 10;
      }
    });

    // Also check ingredients and description so we don't drop valid DB matches
    const searchCorpus = [
      Array.isArray(recipe.key_ingredients) ? recipe.key_ingredients.join(' ') : (recipe.key_ingredients || ''),
      recipe.description || '',
      recipe.cuisine || ''
    ].join(' ').toLowerCase();

    queryTokens.forEach(token => {
      if (searchCorpus.includes(token.toLowerCase())) {
        score += 150; // Give points for matching ingredients/desc
      }
    });
  }

  // Ensure every recipe returned by the DB gets at least 1 point so it isn't filtered out
  return score > 0 ? score : 1;
};

// ─── Query Parser ─────────────────────────────────────────────────────────
const TIME_WORDS = new Set(['min', 'mins', 'minute', 'minutes', 'hour', 'hours', 'hr', 'hrs', 'sec', 'secs']);
const STOP_WORDS  = new Set([
  'i', 'have', 'got', 'want', 'a', 'an', 'the', 'and', 'or', 'with', 'some',
  'make', 'cook', 'prepare', 'need', 'using', 'use', 'can', 'me', 'something',
  'what', 'how', 'find', 'show', 'about', 'for', 'of', 'in', 'to', 'only', 'just',
  'something', 'anything', 'please', 'help', 'quick', 'fast', 'easy', 'simple',
  'recipes', 'recipe', 'dishes', 'dish', 'meals', 'meal', 'cuisine', 'cuisines',
  'world', 'global', 'under', 'above', 'spicy', 'spice', 'hot', 'food',
  'vegetarian', 'vegan', 'gluten', 'dairy', 'recipes', 'recipe', 'meals', 'meal', 'dishes', 'dish', 'cuisine', 'quick', 'easy', 'diet', 'dietary'
]);

function parseQuery(text) {
  const lower = text.toLowerCase();

  // Extract max time
  const timeMatch = lower.match(/(\d+)\s*(?:min|mins|minute|minutes)/);
  const maxTime   = timeMatch ? parseInt(timeMatch[1], 10) : null;

  // Extract dietary flags from text
  const dietary = {
    vegan:       /\bvegan\b/.test(lower),
    vegetarian:  /\bvegetarian\b/.test(lower),
    glutenFree:  /\bgluten.?free\b/.test(lower),
    dairyFree:   /\bdairy.?free\b/.test(lower),
    keto:        /\bketo\b/.test(lower),
    spicy:       /\b(spicy|spice|hot)\b/.test(lower),
  };

  // Extract ingredient-like words
  const tokens = lower
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t) && !TIME_WORDS.has(t) && !/^\d+$/.test(t));

  return { ingredients: [...new Set(tokens)], maxTime, dietary };
}

// ─── Strict Client-Side Allergy Filter ───────────────────────────────────────
const preCleanIngredientsText = (text) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/coconut/g, 'safe_coconut')
    .replace(/nutmeg/g, 'safe_spice')
    .replace(/butternut/g, 'safe_squash');
};

const filterRecipeByAllergiesAndRestrictions = (recipe, restrictions) => {
  const hasPeanutAllergy = restrictions.some(r => /peanut|nut/i.test(r));
  const isGlutenFreePref = restrictions.some(r => /gluten/i.test(r));
  const isVeganPref = restrictions.some(r => /vegan/i.test(r));
  const isVegetarianPref = restrictions.some(r => /veget/i.test(r));
  const isDairyFreePref = restrictions.some(r => /dairy|milk|lactose/i.test(r));

  // 1. Check local flags (if they are present)
  if (recipe.contains_nuts !== undefined && recipe.contains_nuts && hasPeanutAllergy) return false;
  if (recipe.is_gluten_free !== undefined && !recipe.is_gluten_free && isGlutenFreePref) return false;
  if (recipe.is_vegan !== undefined && !recipe.is_vegan && isVeganPref) return false;
  if (recipe.is_vegetarian !== undefined && !recipe.is_vegetarian && isVegetarianPref) return false;
  if (recipe.contains_dairy !== undefined && recipe.contains_dairy && isDairyFreePref) return false;

  // 2. Check ingredient text for web recipes or as an extra guard
  const cleanedIngredientsText = preCleanIngredientsText(recipe.full_ingredients || '');
  
  if (hasPeanutAllergy) {
    const nutRegex = /\b(peanut|almond|walnut|cashew|pecan|hazelnut|macadamia|pistachio|chestnut|hazelnut|nut)\b/i;
    if (nutRegex.test(cleanedIngredientsText)) {
      const words = cleanedIngredientsText.match(/\b\w+\b/g) || [];
      const hasRealNut = words.some(w => 
        (w.includes('nut') || w === 'almond' || w === 'walnut' || w === 'cashew' || w === 'pecan' || w === 'hazelnut' || w === 'macadamia' || w === 'pistachio') &&
        w !== 'coconut' && w !== 'nutmeg' && w !== 'butternut' && w !== 'safe_squash' && w !== 'safe_spice' && w !== 'safe_coconut'
      );
      if (hasRealNut) return false;
    }
  }

  if (isGlutenFreePref) {
    const glutenRegex = /\b(wheat|barley|rye|flour|semolina|spelt|pasta|bread|couscous)\b/i;
    if (glutenRegex.test(cleanedIngredientsText) && !cleanedIngredientsText.includes('gluten-free') && !cleanedIngredientsText.includes('gluten free') && !cleanedIngredientsText.includes('safe_gf_item')) {
      return false;
    }
  }

  if (isDairyFreePref) {
    const dairyRegex = /\b(milk|cheese|butter|cream|yogurt|ghee|paneer|curd|whey|casein)\b/i;
    if (dairyRegex.test(cleanedIngredientsText) && !cleanedIngredientsText.includes('dairy-free') && !cleanedIngredientsText.includes('dairy free') && !cleanedIngredientsText.includes('safe_df_item')) {
      return false;
    }
  }

  return true;
};

// ─── Cuisine flag mapping ──────────────────────────────────────────────────
const CUISINE_FLAGS = {
  Italian: '🇮🇹', Mexican: '🇲🇽', Indian: '🇮🇳', Japanese: '🇯🇵', Chinese: '🇨🇳',
  Thai: '🇹🇭', French: '🇫🇷', Greek: '🇬🇷', Spanish: '🇪🇸', American: '🇺🇸',
  Korean: '🇰🇷', Vietnamese: '🇻🇳', Lebanese: '🇱🇧', Turkish: '🇹🇷', Moroccan: '🇲🇦',
  Brazilian: '🇧🇷', Ethiopian: '🇪🇹', British: '🇬🇧', Caribbean: '🇯🇲', Persian: '🇮🇷',
};

const getCuisineFlag = (cuisine) => CUISINE_FLAGS[cuisine] || '🌍';

// ─── Difficulty badge colors ───────────────────────────────────────────────
const difficultyStyle = (d) => {
  switch ((d || '').toLowerCase()) {
    case 'easy':   return 'bg-secondary-container text-on-secondary-container';
    case 'medium': return 'bg-primary-container text-on-primary-container';
    case 'hard':   return 'bg-tertiary-container text-on-tertiary-container';
    default:       return 'bg-surface-container text-on-surface-variant';
  }
};

// ─── Gradient palettes for cards without images ───────────────────────────
const CARD_GRADIENTS = [
  'from-amber-500 to-orange-600',
  'from-purple-500 to-pink-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-red-600',
  'from-indigo-500 to-blue-600',
  'from-green-500 to-emerald-600',
];

// ─── Hint queries shown when search bar is focused ────────────────────────
const HINT_QUERIES = [
  'I have chicken, cabbage and 20 mins',
  'Quick vegan pasta with tomatoes',
  'Spicy Korean dinner under 30 minutes',
];

const HINT_CHIPS = [
  { label: '🎲 Surprise me', query: 'surprise me' },
  { label: '🥗 Vegetarian', query: 'vegetarian recipes' },
  { label: '⚡ Quick meals', query: 'quick meals under 20 mins' },
  { label: '🌶 Spicy',       query: 'spicy dishes' },
  { label: '🌍 Global',      query: 'global cuisine world recipes' },
];

// ─────────────────────────────────────────────────────────────────────────
//  DiscoveryHome
// ─────────────────────────────────────────────────────────────────────────
const DiscoveryHome = () => {
  const navigate = useNavigate();
  const { userProfile, dietaryRestrictions, addSearchToHistory, toggleSaveRecipe, savedRecipes } = useAppStore();

  // State
  const [searchQuery, setSearchQuery]     = useState('');
  const [predictions, setPredictions]     = useState([]);
  const [isListening, setIsListening]     = useState(false);
  const [isSearching, setIsSearching]     = useState(false);
  const [hasSearched, setHasSearched]     = useState(false);
  const [showResults, setShowResults]     = useState(false);
  const [results, setResults]             = useState([]);
  const [showHints, setShowHints]         = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [searchError, setSearchError]     = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [page, setPage]                   = useState(1);
  const [hasMore, setHasMore]             = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const parseRestriction = (r) => {
    if (typeof r === 'string') {
      try {
        const obj = JSON.parse(r);
        return obj.name || r;
      } catch (e) {
        return r;
      }
    }
    return r?.name || String(r);
  };

  const activeRestrictionsRender = [
    ...(userProfile?.dietaryRestrictions || []).map(parseRestriction),
    ...(Array.isArray(dietaryRestrictions)
      ? dietaryRestrictions.map(parseRestriction)
      : []),
  ];
  const uniqueRestrictions = [...new Set(activeRestrictionsRender)];

  const inputRef      = useRef(null);
  const resultsRef    = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ── Build Supabase dietary filters from store ──
  const buildDietaryFilters = useCallback(() => {
    const restrictions = [
      ...(userProfile?.dietaryRestrictions || []),
      ...(Array.isArray(dietaryRestrictions)
        ? dietaryRestrictions.map((r) => (typeof r === 'string' ? r : r.name))
        : []),
    ];

    const filters = {};
    if (restrictions.some((r) => /peanut|nut/i.test(r)))      filters.contains_nuts   = false;
    if (restrictions.some((r) => /vegan/i.test(r)))        filters.is_vegan        = true;
    if (restrictions.some((r) => /veget/i.test(r)))        filters.is_vegetarian   = true;
    if (restrictions.some((r) => /gluten/i.test(r)))       filters.is_gluten_free  = true;
    return filters;
  }, [userProfile, dietaryRestrictions]);
  
  // ── Autocomplete / Search Predictions ──
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setPredictions([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const suggestions = await getUnifiedSuggestions(trimmed);
        
        // Map to standard prediction format while preserving navigation data
        const formatted = suggestions.map(s => ({
          id: s.id,
          dish_name: s.title,
          image_url: s.thumbnail,
          source: s.source,
          cuisine: s.recipeData?.cuisine || 'Global',
          type: s.type,
          recipeData: s.recipeData
        }));
        
        setPredictions(formatted);
      } catch (err) {
        console.error('[Autocomplete] Fetch error:', err);
        setPredictions([]);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ── Supabase recipe search ──
  const performSearch = useCallback(async (rawQuery) => {
    const query = (rawQuery || searchQuery).trim();
    if (!query) return;

    const isRandomIntent = /anything|surprise me|you decide|dont know|don't know|whatever|random|decide for me/i.test(query);

    setIsSearching(true);
    setShowResults(true);
    setSearchError(null);
    setResults([]);
    
    // Pick a random starting page between 1 and 50 if the user doesn't know what they want
    const startPage = isRandomIntent ? Math.floor(Math.random() * 50) + 1 : 1;
    setPage(startPage);
    
    setHasMore(false);
    addSearchToHistory(query);
    setHasSearched(true);
    setPredictions([]);

    try {
      const { ingredients: rawIngredients, maxTime, dietary } = parseQuery(query);
      // If it's a random intent, clear ingredients so we don't accidentally text-search for "surprise"
      const ingredients = isRandomIntent ? [] : rawIngredients;

      const { results: uniqueRecipes, hasMore: more } = await getUnifiedFullSearch(query, { ingredients, dietary, maxTime }, startPage);

      // ── Apply strict allergy and dietary filter on merged list ──
      const activeRestrictions = [
        ...(userProfile?.dietaryRestrictions || []),
        ...(Array.isArray(dietaryRestrictions)
          ? dietaryRestrictions.map((r) => (typeof r === 'string' ? r : r.name))
          : []),
      ].map(r => r.toLowerCase());

      const allergyFiltered = uniqueRecipes.filter(recipe => {
        if (!filterRecipeByAllergiesAndRestrictions(recipe, activeRestrictions)) return false;

        // Ensure dietary restrictions are respected even if Supabase/Local missed them
        if (dietary.vegan && recipe.is_vegan === false) return false;
        if (dietary.vegetarian && recipe.is_vegetarian === false) return false;
        if (dietary.glutenFree && recipe.is_gluten_free === false) return false;

        return true;
      });

      // Apply Health Goals Filter
      const { healthGoals } = useAppStore.getState();
      const healthFiltered = allergyFiltered.filter(recipe => {
        const queryLower = query.toLowerCase().replace(/\s+/g, '');
        const nameLower = (recipe.dish_name || recipe.title || '').toLowerCase().replace(/\s+/g, '');
        if (queryLower && (nameLower === queryLower || nameLower.startsWith(queryLower))) return true;

        if (healthGoals?.calories && recipe.calories && recipe.calories > Number(healthGoals.calories)) return false;
        const textToSearch = (recipe.dish_name + ' ' + (recipe.description || '') + ' ' + (recipe.full_ingredients || '')).toLowerCase();
        if (healthGoals?.glucoseTarget && /pasta|rice|bread|potato|sugar|honey/i.test(textToSearch)) return false;
        return true;
      });

      // Filter by time limit client-side for web recipes if needed
      const finalRecipes = healthFiltered.filter(recipe => {
        if (maxTime && recipe.total_time_min) {
          return recipe.total_time_min <= maxTime;
        }
        return true;
      });

      // Filter out low relevance scores (like middle-substring matches) and sort
      // If no specific text ingredients were parsed (e.g., query is only stop words and time limits), bypass text relevance filter
      const scoredRecipes = finalRecipes.map(recipe => ({
        recipe,
        score: ingredients.length === 0 ? 500 : getSearchRelevanceScore(recipe, query, ingredients)
      })).filter(item => item.score > 0);

      let sortedRecipes = scoredRecipes.sort((a, b) => b.score - a.score).map(item => item.recipe);

      if (isRandomIntent) {
        sortedRecipes = sortedRecipes.sort(() => Math.random() - 0.5);
      }

      // --- Batch Fetch Missing Images from Supabase ---
      const missingImages = sortedRecipes.filter(r => !cleanImageUrl(r.image_url) && !cleanImageUrl(r.thumbnail)).map(r => r.dish_name);
      if (missingImages.length > 0) {
        try {
          const { data: imgData } = await supabase
            .from('dish_images')
            .select('dish_name, image_url')
            .in('dish_name', missingImages);
          
          if (imgData && imgData.length > 0) {
            const imgMap = {};
            imgData.forEach(img => { imgMap[img.dish_name] = img.image_url; });
            sortedRecipes = sortedRecipes.map(r => {
              if (imgMap[r.dish_name]) {
                return { ...r, image_url: imgMap[r.dish_name] };
              }
              return r;
            });
          }
        } catch (e) {
          console.warn("Failed to batch fetch images:", e);
        }
      }

      setResults(sortedRecipes);
      setHasMore(more);

      if (finalRecipes.length === 0) {
        setSearchError(null); // not error, just empty
      }
    } catch (err) {
      console.error('[Discovery] Search failed:', err);
      setSearchError('Unable to load recipes. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
      // Smooth-scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [searchQuery, addSearchToHistory, userProfile, dietaryRestrictions]);

  // ── Load More Pagination ──
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !searchQuery) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { ingredients: rawIngredients, maxTime, dietary } = parseQuery(searchQuery);
      const isRandomIntent = /anything|surprise me|you decide|dont know|don't know|whatever|random|decide for me/i.test(searchQuery);
      const ingredients = isRandomIntent ? [] : rawIngredients;
      
      const { results: newRecipes, hasMore: more } = await getUnifiedFullSearch(searchQuery, { ingredients, dietary, maxTime }, nextPage);
      
      const activeRestrictions = [
        ...(userProfile?.dietaryRestrictions || []),
        ...(Array.isArray(dietaryRestrictions)
          ? dietaryRestrictions.map((r) => (typeof r === 'string' ? r : r.name))
          : []),
      ].map(r => r.toLowerCase());

      const allergyFiltered = newRecipes.filter(recipe => 
        filterRecipeByAllergiesAndRestrictions(recipe, activeRestrictions)
      );

      // Apply Health Goals Filter
      const { healthGoals } = useAppStore.getState();
      const healthFiltered = allergyFiltered.filter(recipe => {
        const queryLower = searchQuery.toLowerCase().replace(/\s+/g, '');
        const nameLower = (recipe.dish_name || recipe.title || '').toLowerCase().replace(/\s+/g, '');
        if (queryLower && (nameLower === queryLower || nameLower.startsWith(queryLower))) return true;

        if (healthGoals?.calories && recipe.calories && recipe.calories > Number(healthGoals.calories)) return false;
        const textToSearch = (recipe.dish_name + ' ' + (recipe.description || '') + ' ' + (recipe.full_ingredients || '')).toLowerCase();
        if (healthGoals?.glucoseTarget && /pasta|rice|bread|potato|sugar|honey/i.test(textToSearch)) return false;
        return true;
      });

      const finalRecipes = healthFiltered.filter(recipe => {
        if (maxTime && recipe.total_time_min) {
          return recipe.total_time_min <= maxTime;
        }
        return true;
      });

      const scoredRecipes = finalRecipes.map(recipe => ({
        recipe,
        score: ingredients.length === 0 ? 500 : getSearchRelevanceScore(recipe, searchQuery, ingredients)
      })).filter(item => item.score > 0);

      let sortedRecipes = scoredRecipes.sort((a, b) => b.score - a.score).map(item => item.recipe);

      if (isRandomIntent) {
        sortedRecipes = sortedRecipes.sort(() => Math.random() - 0.5);
      }

      // --- Batch Fetch Missing Images from Supabase ---
      const missingImages = sortedRecipes.filter(r => !cleanImageUrl(r.image_url) && !cleanImageUrl(r.thumbnail)).map(r => r.dish_name);
      if (missingImages.length > 0) {
        try {
          const { data: imgData } = await supabase
            .from('dish_images')
            .select('dish_name, image_url')
            .in('dish_name', missingImages);
          
          if (imgData && imgData.length > 0) {
            const imgMap = {};
            imgData.forEach(img => { imgMap[img.dish_name] = img.image_url; });
            sortedRecipes = sortedRecipes.map(r => {
              if (imgMap[r.dish_name]) {
                return { ...r, image_url: imgMap[r.dish_name] };
              }
              return r;
            });
          }
        } catch (e) {
          console.warn("Failed to batch fetch images:", e);
        }
      }

      setResults(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const extra = sortedRecipes.filter(r => !existingIds.has(r.id));
        return [...prev, ...extra];
      });
      setPage(nextPage);
      setHasMore(more);
    } catch (err) {
      console.error('[Discovery] Load more failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, searchQuery, userProfile, dietaryRestrictions]);

  // ── Voice Search ──
  const handleVoiceSearch = async () => {
    // Try Capacitor native first
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
      const available = await SpeechRecognition.available();
      if (available.available) {
        await SpeechRecognition.requestPermissions();
        setIsListening(true);
        const result = await SpeechRecognition.start({
          language: 'en-US',
          maxResults: 1,
          popup: false,
        });
        setIsListening(false);
        if (result?.matches?.[0]) {
          setSearchQuery(result.matches[0]);
          performSearch(result.matches[0]);
        }
        return;
      }
    } catch (e) {
      setIsListening(false);
      console.warn('[Voice] Capacitor SR failed, falling back to web:', e);
    }

    // Web fallback
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart  = () => setIsListening(true);
    recognition.onend    = () => setIsListening(false);
    recognition.onerror  = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      performSearch(transcript);
    };
    recognition.start();
  };

  // ── Keyboard handler ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { setShowHints(false); performSearch(); }
    if (e.key === 'Escape') { setShowHints(false); }
  };

  const navigateToDetailedView = (recipe) => {
    const mappedRecipe = {
      title: recipe.dish_name || recipe.title || 'Unnamed Recipe',
      description: recipe.description || 'A delicious culinary creation',
      prepTime: recipe.total_time_min ? `${recipe.total_time_min} min` : '25 min',
      calories: recipe.calories || 450,
      ingredients: recipe.full_ingredients
        ? (recipe.full_ingredients.includes('\n') ? recipe.full_ingredients.split('\n') : recipe.full_ingredients.split(','))
            .map(i => i.trim()).filter(Boolean)
        : [],
      instructions: recipe.detailed_recipe
        ? recipe.detailed_recipe.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
      img: cleanImageUrl(recipe.image_url) || cleanImageUrl(recipe.thumbnail) || getDishImage(recipe.dish_name || recipe.title || 'recipe'),
      id: recipe.id,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      rawDetailedRecipe: recipe.detailed_recipe
    };
    navigate('/recipe', { state: { recipe: mappedRecipe } });
  };

  // ── Recipe click handler (navigates to separate screen) ──
  const openRecipe = async (recipe) => {
    if (recipe.is_web && (!recipe.full_ingredients || !recipe.detailed_recipe)) {
      setIsFetchingDetails(true);
      try {
        let details = null;
        if (recipe.source === 'Spoonacular') {
          details = await getSpoonacularRecipe(recipe.externalId);
        } else if (recipe.source === 'TheMealDB') {
          details = await lookupMealDBById(recipe.externalId);
        }
        if (details) {
          const enrichedRecipe = {
            ...recipe,
            full_ingredients: details.ingredients?.join('\n') || '',
            detailed_recipe: details.instructions?.join('\n') || '',
            description: details.description || recipe.description,
            is_vegetarian: recipe.is_vegetarian || details.tags?.includes('vegetarian') || false,
            is_vegan: recipe.is_vegan || details.tags?.includes('vegan') || false,
            is_gluten_free: recipe.is_gluten_free || details.tags?.includes('gluten free') || false,
          };
          navigateToDetailedView(enrichedRecipe);
        } else {
          navigateToDetailedView(recipe);
        }
      } catch (err) {
        console.error('Failed to fetch web recipe details:', err);
        navigateToDetailedView(recipe);
      } finally {
        setIsFetchingDetails(false);
      }
    } else {
      navigateToDetailedView(recipe);
    }
  };
  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedRecipe(null), 300);
  };

  const isRecipeSaved = (recipe) =>
    savedRecipes?.some((r) => r.id === recipe.id || r.title === recipe.dish_name);

  // ── Instruction steps ──
  const parseSteps = (raw) => {
    if (!raw) return [];
    return raw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#fff8f1]">

      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION — full viewport
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pb-24 overflow-hidden"
        style={{
          background: '#fff8f1',
        }}
      >
        {/* Animated blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #f4c430 0%, transparent 70%)',
              top: '-10%', left: '-15%',
              animation: 'blob1 12s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #ffdf90 0%, transparent 70%)',
              bottom: '-10%', right: '-10%',
              animation: 'blob2 15s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute w-[350px] h-[350px] rounded-full opacity-[0.08] blur-2xl"
            style={{
              background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
              top: '40%', left: '60%',
              animation: 'blob1 10s ease-in-out infinite alternate-reverse',
            }}
          />
        </div>

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl"
          style={{ paddingTop: '80px' }}
        >
          {/* Logo / icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
            className="mb-6 flex items-center justify-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: '#fcf2e3', border: '1px solid #d1c5ad' }}
            >
              <span className="material-icons text-[#755b00] text-4xl">restaurant</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-4xl sm:text-5xl font-bold text-[#1f1b12] leading-tight mb-3"
          >
            What would you like<br />to cook today?
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-[#4e4634] text-lg mb-8 max-w-lg font-medium"
          >
            Tell me what ingredients you have, how much time, or what you're craving
          </motion.p>

          {/* ── Search bar ── */}
          <motion.div
            ref={searchContainerRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative w-full max-w-xl"
          >
            <div
              className="flex items-center rounded-2xl transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1.5px solid #d1c5ad',
                boxShadow: '0 8px 32px rgba(117, 91, 0, 0.08)',
              }}
            >
              <span className="material-icons text-[#4e4634] ml-4 flex-shrink-0">search</span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowHints(true)}
                placeholder="e.g. I have chicken, cabbage and 20 mins..."
                className="flex-1 bg-transparent border-none outline-none py-4 px-3 text-[#1f1b12] placeholder-[#807661]/70 text-base min-w-0 font-medium"
                style={{ caretColor: '#755b00' }}
              />
              <div className="flex items-center gap-1 pr-2 flex-shrink-0">
                {/* Mic button */}
                <button
                  onClick={handleVoiceSearch}
                  title="Voice Search"
                  disabled={isSearching}
                  className={`p-2 rounded-xl transition-all active:scale-95 ${
                    isListening
                      ? 'bg-red-500/20 text-red-600 animate-pulse'
                      : 'hover:bg-[#f6eddd] text-[#807661] hover:text-[#1f1b12]'
                  }`}
                >
                  <span className="material-icons text-[22px]">
                    {isListening ? 'graphic_eq' : 'mic'}
                  </span>
                </button>
                {/* Send button */}
                <button
                  onClick={() => performSearch()}
                  disabled={isSearching || !searchQuery.trim()}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #f4c430, #755b00)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(117,91,0,0.25)',
                  }}
                >
                  {isSearching
                    ? <span className="material-icons text-[18px] animate-spin">refresh</span>
                    : <><span className="material-icons text-[18px]">send</span><span className="hidden sm:inline">Search</span></>
                  }
                </button>
              </div>
            </div>

            {/* Hint line below the search bar to guide user */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-[#807661] text-xs mt-3 italic font-medium flex items-center gap-1 justify-center pointer-events-none"
            >
              <span className="material-icons text-[14px]">info</span>
              Try typing or saying: "I have chicken, cabbage and 20 mins to make"
            </motion.p>

            {/* Hint dropdown */}
            <AnimatePresence>
              {showHints && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(255, 248, 241, 0.96)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid #d1c5ad',
                    boxShadow: '0 16px 40px rgba(117, 91, 0, 0.12)',
                    maxHeight: '340px',
                    overflowY: 'auto'
                  }}
                >
                  {searchQuery.trim().length > 0 ? (
                    <>
                      <p className="text-[#807661] text-xs font-semibold uppercase tracking-wider px-4 pt-3 pb-1 border-b border-[#d1c5ad]/20">
                        Suggested Recipes
                      </p>
                      {predictions.length > 0 ? (
                        predictions.map((recipe, i) => {
                          const flag = getCuisineFlag(recipe.cuisine);
                          const imageUrl = cleanImageUrl(recipe.image_url) || cleanImageUrl(recipe.thumbnail) || getDishImage(recipe.dish_name || recipe.title || 'recipe', i);
                          return (
                            <button
                              key={recipe.id || i}
                              onMouseDown={() => {
                                setSearchQuery(recipe.dish_name);
                                setShowHints(false);
                                performSearch(recipe.dish_name);
                              }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#f6eddd] transition-colors border-b border-[#d1c5ad]/20 last:border-b-0"
                            >
                              {imageUrl && (
                                <img
                                  src={imageUrl}
                                  alt={recipe.dish_name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-gradient-to-br from-primary/30 to-tertiary/30 items-center justify-center" style={{ display: imageUrl ? 'none' : 'flex' }}>
                                <span className="text-on-surface text-sm font-bold opacity-50 uppercase">{recipe.dish_name?.charAt(0) || 'R'}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[#1f1b12] text-sm font-semibold truncate">
                                  {recipe.dish_name}
                                </p>
                                <p className="text-[#807661] text-xs font-medium truncate flex items-center gap-1.5 mt-0.5">
                                  <span>{flag} {recipe.cuisine || 'Global'}</span>
                                  {recipe.total_time_min && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-[#807661]/40" />
                                      <span className="flex items-center gap-0.5">
                                        <span className="material-icons text-[12px]">schedule</span>
                                        {recipe.total_time_min} min
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-sm text-[#807661] italic">
                          {searchQuery.trim().length < 2 ? 'Type at least 2 characters...' : 'No matching recipes found'}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[#807661] text-xs font-semibold uppercase tracking-wider px-4 pt-3 pb-1">
                        Try these
                      </p>
                      {HINT_QUERIES.map((hint, i) => (
                        <button
                          key={i}
                          onMouseDown={() => {
                            setSearchQuery(hint);
                            setShowHints(false);
                            performSearch(hint);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#f6eddd] transition-colors"
                        >
                          <span className="material-icons text-[#755b00] text-[18px]">tips_and_updates</span>
                          <span className="text-[#1f1b12] text-sm font-medium">{hint}</span>
                        </button>
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Hint chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-5"
          >
            {HINT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => { setSearchQuery(chip.query); performSearch(chip.query); }}
                className="px-4 py-2 rounded-full text-sm font-medium text-[#4e4634] transition-all active:scale-95 hover:scale-105"
                style={{
                  background: '#fcf2e3',
                  border: '1px solid #d1c5ad',
                  boxShadow: '0 2px 8px rgba(117, 91, 0, 0.04)',
                }}
              >
                {chip.label}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#807661]"
          style={{ animation: 'bounceY 2s ease-in-out infinite' }}
        >
          <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
          <span className="material-icons text-[22px]">keyboard_arrow_down</span>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          RESULTS SECTION
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showResults && (
          <motion.section
            ref={resultsRef}
            id="search-results-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            className="w-full px-4 pt-10 pb-32 max-w-7xl mx-auto scroll-mt-20"
          >
            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-icons text-primary">dinner_dining</span>
                  Recipes found for you
                </h2>
                <p className="text-on-surface-variant text-sm mt-1">
                  Matching "<span className="text-primary font-medium">{searchQuery}</span>"
                </p>
              </div>
              <div className="flex items-center gap-2">
                {uniqueRestrictions.length > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium max-w-[200px] sm:max-w-xs"
                    style={{ background: 'rgba(102,221,139,0.15)', color: 'var(--color-secondary)' }}
                  >
                    <span className="material-icons text-[16px] flex-shrink-0">verified</span>
                    <span className="truncate" title={`Filtered for: ${uniqueRestrictions.join(', ')}`}>
                      Filtered for: {uniqueRestrictions.join(', ')}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => { setShowResults(false); setResults([]); }}
                  className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
                >
                  <span className="material-icons text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Loading skeleton */}
            {isSearching && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-surface-container-low h-64" />
                ))}
              </div>
            )}

            {/* Error */}
            {searchError && !isSearching && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-icons text-5xl text-error mb-4">wifi_off</span>
                <p className="text-on-surface-variant">{searchError}</p>
              </div>
            )}

            {/* Empty state */}
            {!isSearching && !searchError && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-icons text-5xl text-on-surface-variant/40 mb-4">search_off</span>
                <h3 className="font-semibold text-on-surface mb-1">No recipes found</h3>
                <p className="text-on-surface-variant text-sm max-w-sm">
                  Try different ingredients or remove some dietary filters.
                </p>
              </div>
            )}

            {/* Recipe card grid */}
            {!isSearching && results.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
              >
                {results.map((recipe, idx) => (
                  <RecipeCard
                    key={recipe.id || idx}
                    recipe={recipe}
                    index={idx}
                    isSaved={isRecipeSaved(recipe)}
                    onOpen={openRecipe}
                    onSave={() =>
                      toggleSaveRecipe({
                        id: recipe.id,
                        title: recipe.dish_name,
                        cuisine: recipe.cuisine,
                        time_minutes: recipe.total_time_min,
                      })
                    }
                  />
                ))}
              </motion.div>
            )}

            {/* Load More Button */}
            {hasMore && !isSearching && (
              <div className="mt-8 flex justify-center pb-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-primary text-on-primary rounded-full font-medium shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <><span className="material-icons animate-spin">refresh</span> Loading...</>
                  ) : (
                    <><span className="material-icons">expand_more</span> Load More Recipes</>
                  )}
                </button>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          FETCHING DETAILS LOADING OVERLAY
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isFetchingDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
          >
            <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-0 border-4 border-primary/20 rounded-full"
              ></motion.div>
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 border-t-4 border-primary rounded-full shadow-[0_0_20px_rgba(117,91,0,0.4)]"
              ></motion.div>
              <span className="material-symbols-outlined !text-6xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
            </div>
            <motion.h3 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-headline-lg text-headline-lg text-on-surface"
            >
              Loading Recipe...
            </motion.h3>
            <p className="text-on-surface-variant font-body-lg mt-2">Retrieving ingredients and steps from culinary database</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Animations keyframes injected inline ── */}
      <style>{`
        @keyframes blob1 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 30px) scale(1.1); }
        }
        @keyframes blob2 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-30px, -40px) scale(1.08); }
        }
        @keyframes bounceY {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  RecipeCard
// ─────────────────────────────────────────────────────────────────────────────
const RecipeCard = ({ recipe, index, isSaved, onOpen, onSave }) => {
  const [unsplashImage, setUnsplashImage] = useState(null);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const flag     = getCuisineFlag(recipe.cuisine);
  const fallbackImg = getDishImage(recipe.dish_name || recipe.title || 'recipe', index);
  const initialImageUrl = cleanImageUrl(recipe.image_url) || cleanImageUrl(recipe.thumbnail) || cleanImageUrl(fallbackImg);

  useEffect(() => {
    const fetchImg = async () => {
      // initialImageUrl is guaranteed to be a real image if it exists because of cleanImageUrl.
      if (initialImageUrl) return; 
      const title = recipe.dish_name || recipe.title;
      if (title) {
        const img = await getDishImageWaterfall(title);
        if (img) setUnsplashImage(img);
      }
    };
    fetchImg();
  }, [recipe.dish_name, recipe.title, initialImageUrl]);

  // Use Wikipedia/DB image first, fallback to Unsplash, then generic fallback
  const imageUrl = initialImageUrl || unsplashImage || fallbackImg;

  return (
    <motion.div
      variants={{
        hidden:  { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
      onClick={() => onOpen({ ...recipe, resolved_image: imageUrl })}
      className="rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-shadow duration-300 bg-[#fcf2e3] border border-[#d1c5ad]/40"
    >
      {/* Card image / gradient */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-end overflow-hidden`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={recipe.dish_name || recipe.title}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-white/20 animate-pulse flex items-center justify-center backdrop-blur-sm">
            <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 items-center justify-center" style={{ display: 'none' }}>
          <span className="text-white text-6xl font-bold opacity-40 uppercase tracking-widest">
            {(recipe.dish_name || recipe.title || 'R').charAt(0)}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="relative z-10 flex items-center gap-2 p-3 w-full justify-between">
          <div className="flex items-center gap-1.5">
            {recipe.is_vegetarian && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-secondary-container text-on-secondary-container">
                🥗 Veg
              </span>
            )}
            {recipe.is_vegan && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-secondary-container text-on-secondary-container">
                🌱 Vegan
              </span>
            )}
            {recipe.is_gluten_free && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-primary-container text-on-primary-container">
                GF
              </span>
            )}
          </div>
          {/* Allergy safe */}
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/20 text-white backdrop-blur-sm flex items-center gap-0.5">
            <span className="material-icons text-[12px]">shield</span> Safe
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-[#1f1b12] text-base leading-snug flex-1 line-clamp-2">
            {recipe.dish_name || 'Unnamed Recipe'}
          </h3>
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            className="text-[#807661] hover:text-[#755b00] transition-colors flex-shrink-0 mt-0.5"
          >
            <span className="material-icons text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0", color: isSaved ? '#755b00' : 'inherit' }}>
              bookmark
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[#4e4634] text-xs font-medium">
          <span className="flex items-center gap-0.5">
            {flag} {recipe.cuisine || 'Global'}
          </span>
          {recipe.total_time_min && (
            <span className="flex items-center gap-0.5">
              <span className="material-icons text-[14px]">schedule</span>
              {recipe.total_time_min} min
            </span>
          )}
          {recipe.difficulty && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${difficultyStyle(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  RecipeModal
// ─────────────────────────────────────────────────────────────────────────────
const parseSteps = (raw) => {
  if (!raw) return [];
  return raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
};

const RecipeModal = ({ recipe, isSaved, onClose, onSave, onStartCooking }) => {
  const flag  = getCuisineFlag(recipe.cuisine);
  const steps = parseSteps(recipe.detailed_recipe);
  const ingredients = recipe.full_ingredients
    ? recipe.full_ingredients.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="w-full sm:max-w-2xl max-h-[95dvh] sm:max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Modal image header */}
        <div className="relative h-52 flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-700">
          {(recipe.resolved_image || recipe.image_url) && (
            <img
              src={recipe.resolved_image || recipe.image_url}
              alt={recipe.dish_name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <span className="material-icons text-white text-[20px]">close</span>
          </button>

          {/* Save button */}
          <button
            onClick={onSave}
            className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <span
              className="material-icons text-white text-[20px]"
              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 p-5 w-full">
            <h2 className="text-2xl font-bold text-white leading-tight">
              {recipe.dish_name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-white/80 text-sm">
              <span>{flag} {recipe.cuisine || 'Global'}</span>
              {recipe.total_time_min && (
                <span className="flex items-center gap-0.5">
                  <span className="material-icons text-[15px]">schedule</span>
                  {recipe.total_time_min} min
                </span>
              )}
              {recipe.difficulty && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${difficultyStyle(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
              )}
              {recipe.spice_level && (
                <span className="flex items-center gap-0.5">
                  🌶 {recipe.spice_level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 pb-2">
            {recipe.isLoadingDetails ? (
              <div className="space-y-6 py-4">
                {/* Skeleton Loader */}
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-on-surface/10 rounded w-1/3"></div>
                  <div className="h-3 bg-on-surface/10 rounded w-1/4"></div>
                </div>
                
                <div className="space-y-3 animate-pulse">
                  <div className="h-5 bg-on-surface/10 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-on-surface/10 rounded w-full"></div>
                  <div className="h-4 bg-on-surface/10 rounded w-5/6"></div>
                  <div className="h-4 bg-on-surface/10 rounded w-4/5"></div>
                </div>

                <div className="space-y-3 animate-pulse pt-4">
                  <div className="h-5 bg-on-surface/10 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-on-surface/10 rounded w-full"></div>
                  <div className="h-4 bg-on-surface/10 rounded w-11/12"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Allergy badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {recipe.is_vegetarian && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-secondary-container text-on-secondary-container">🥗 Vegetarian</span>
                  )}
                  {recipe.is_vegan && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-secondary-container text-on-secondary-container">🌱 Vegan</span>
                  )}
                  {recipe.is_gluten_free && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-primary-container text-on-primary-container">🌾 Gluten-Free</span>
                  )}
                  {recipe.contains_nuts === false && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-tertiary-container text-on-tertiary-container">🥜 Nut-Free</span>
                  )}
                </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-on-surface text-lg mb-3 flex items-center gap-2">
                  <span className="material-icons text-primary text-[20px]">grocery</span>
                  Ingredients
                </h3>
                <ul className="space-y-2">
                  {ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold"
                        style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }}
                      >
                        {i + 1}
                      </span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Steps */}
            {steps.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-on-surface text-lg mb-3 flex items-center gap-2">
                  <span className="material-icons text-primary text-[20px]">format_list_numbered</span>
                  Instructions
                </h3>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                          color: '#fff',
                        }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {ingredients.length === 0 && steps.length === 0 && (
              <p className="text-on-surface-variant text-sm text-center py-8">
                Full recipe details not available for this dish.
              </p>
            )}
            </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 p-4 border-t border-outline-variant/20 flex-shrink-0">
          <button
            onClick={onSave}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm border transition-all active:scale-95 flex-shrink-0"
            style={{
              border: '1.5px solid var(--color-outline-variant)',
              background: isSaved ? 'var(--color-primary-container)' : 'transparent',
              color: isSaved ? 'var(--color-on-primary-container)' : 'var(--color-on-surface)',
            }}
          >
            <span
              className="material-icons text-[18px]"
              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={onStartCooking}
            disabled={recipe.isLoadingDetails}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
            }}
          >
            {recipe.isLoadingDetails ? (
              <>
                <span className="material-icons text-[20px] animate-spin">refresh</span>
                Fetching details...
              </>
            ) : (
              <>
                <span className="material-icons text-[20px]">local_fire_department</span>
                Start Cooking
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DiscoveryHome;
