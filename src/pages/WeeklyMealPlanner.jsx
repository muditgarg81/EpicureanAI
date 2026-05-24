import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { culinaryDataBank, getDishImage, isStrictDishImage, cleanIngredientName } from '../data/culinaryData';
import { fetchDishImageFromUnsplash } from '../services/unsplashService';
import { globalDishNames } from '../data/globalDishNames';
import { generateRecipe, generateWeeklyPlan } from '../services/aiService';
import useAppStore from '../store/useAppStore';
import { 
  fetchRecipesByDishName, 
  lookupMealDBById 
} from '../services/externalRecipeService';
import { getUnifiedSuggestions } from '../services/unifiedSearchService';

// ─── Source Badge Component ───────────────────────────────────────────────────
const SourceBadge = ({ source }) => {
  const config = {
    TheMealDB  : { color: 'bg-amber-500/20  text-amber-400  border-amber-500/30',  label: 'MealDB'      },
    Spoonacular: { color: 'bg-green-500/20  text-green-400  border-green-500/30',  label: 'Spoonacular' },
    'Local'    : { color: 'bg-blue-500/20   text-blue-400   border-blue-500/30',   label: 'Database'    },
  }[source] || { color: 'bg-surface-container text-outline border-outline-variant', label: source };

  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${config.color}`}>
      {config.label}
    </span>
  );
};

const WeeklyMealPlanner = () => {
  const { 
    mealPlan, 
    setMealPlan, 
    resetMealPlan,
    groceryList, 
    toggleGroceryItem, 
    addGroceryItem, 
    removeGroceryItem,
    pantryItems,
    dietaryRestrictions: storeRestrictions,
    activePlan,
    userProfile,
    savedRecipes
  } = useAppStore();
  
  const [isAiPlanning, setIsAiPlanning] = useState(false);
  const [showPlannerUpgradeLock, setShowPlannerUpgradeLock] = useState(false);

  const totalSavedMealsCount = useMemo(() => {
    let count = 0;
    Object.keys(mealPlan).forEach(day => {
      count += (mealPlan[day].breakfast?.length || 0);
      count += (mealPlan[day].lunch?.length || 0);
      count += (mealPlan[day].dinner?.length || 0);
    });
    return count;
  }, [mealPlan]);
  
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [shopSuggestions, setShopSuggestions] = useState([]);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);
  
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [activeOrderItem, setActiveOrderItem] = useState(null);

  const cleanedGroceryList = useMemo(() => {
    return (groceryList || []).map(item => ({
      ...item,
      name: cleanIngredientName(item.name) || item.name
    }));
  }, [groceryList]);

  const uncheckedItems = useMemo(() => cleanedGroceryList.filter(item => !item.checked), [cleanedGroceryList]);

  const deliveryApps = [
    {
      name: 'BigBasket',
      logo: '/bigbasket.png',
      bgColor: 'bg-green-600/10 hover:bg-green-600/20 text-green-700 dark:text-green-400 border border-green-600/30',
      searchUrl: (query) => `https://www.bigbasket.com/ps/?q=${query}`
    },
    {
      name: 'Blinkit',
      logo: '/blinkit.png',
      bgColor: 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-400/30',
      searchUrl: (query) => `https://blinkit.com/s/?q=${query}`
    },
    {
      name: 'Zepto',
      logo: '/zepto.png',
      bgColor: 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-400 border border-purple-600/30',
      searchUrl: (query) => `https://zeptonow.com/search?query=${query}`
    },
    {
      name: 'Instamart',
      logo: '/instamart.png',
      bgColor: 'bg-orange-600/10 hover:bg-orange-600/20 text-orange-700 dark:text-orange-400 border border-orange-600/30',
      searchUrl: (query) => `https://www.swiggy.com/instamart/search?query=${query}`
    }
  ];

  const handleOrderAppClick = (app) => {
    const itemToOrder = activeOrderItem || (uncheckedItems.length > 0 ? uncheckedItems[0] : null);
    if (!itemToOrder) return;
    const encoded = encodeURIComponent(itemToOrder.name);
    const url = app.searchUrl(encoded);
    
    import('@capacitor/browser').then(({ Browser }) => {
      Browser.open({ url, presentationStyle: 'popover' });
    }).catch(err => {
      console.error('Failed to open Capacitor browser, falling back to window.open', err);
      window.open(url, '_blank');
    });
  };

  const GROCERY_VOCAB = [
    'Eggs', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Paneer',
    'Chicken', 'Beef', 'Pork', 'Lamb', 'Salmon', 'Tuna', 'Shrimp',
    'Basmati Rice', 'Arborio Rice', 'Pasta', 'Spaghetti', 'Macaroni', 'Noodles',
    'Bread', 'Sourdough', 'Baguette', 'Pita', 'Tortilla',
    'Tomatoes', 'Onions', 'Garlic', 'Ginger', 'Carrots', 'Spinach', 'Potatoes',
    'Bell Peppers', 'Chili', 'Cucumber', 'Avocado', 'Lemon', 'Lime', 'Mango',
    'Olive Oil', 'Coconut Oil', 'Sesame Oil', 'Ghee',
    'Soy Sauce', 'Fish Sauce', 'Mirin', 'Sake', 'Vinegar',
    'Cumin', 'Turmeric', 'Coriander', 'Paprika', 'Garam Masala', 'Cardamom',
    'Black Pepper', 'Salt', 'Sugar', 'Honey', 'Maple Syrup',
    'All-Purpose Flour', 'Cornstarch', 'Baking Soda', 'Baking Powder', 'Yeast',
    'Coconut Milk', 'Heavy Cream', 'Almond Milk', 'Vegetable Broth', 'Chicken Stock',
    'Chickpeas', 'Lentils', 'Black Beans', 'Kidney Beans', 'Tofu',
    'Peanuts', 'Cashews', 'Almonds', 'Walnuts', 'Sesame Seeds',
    'Dark Chocolate', 'Cocoa Powder', 'Vanilla Extract',
    'Fresh Basil', 'Cilantro', 'Parsley', 'Thyme', 'Rosemary', 'Mint',
    ...Object.values(culinaryDataBank).flatMap(d => d.ingredients || [])
      .map(i => i.replace(/^\d+\s*[a-z]*\s*/i, '').trim())
      .filter(i => i.length > 2 && i.length < 40)
  ];

  const handleShoppingInputChange = (val) => {
    setNewShoppingItem(val);
    if (val.trim().length > 1) {
      const lower = val.toLowerCase();
      const uniq = [...new Set(GROCERY_VOCAB)];
      const filtered = uniq.filter(s => s.toLowerCase().includes(lower)).slice(0, 6);
      setShopSuggestions(filtered);
      setShowShopSuggestions(filtered.length > 0);
    } else {
      setShowShopSuggestions(false);
    }
  };

  const handleSelectShopSuggestion = (val) => {
    setNewShoppingItem(val);
    setShowShopSuggestions(false);
  };
  const days = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return daysOfWeek.map((label, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      return {
        id: label,
        label: label,
        date: d.getDate().toString()
      };
    });
  }, []);

  const [selectedDay, setSelectedDay] = useState(() => {
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return daysOfWeek[new Date().getDay()];
  });

  const [isEditing, setIsEditing] = useState(null); // { day, type, mealIndex } or { day, type, isNew: true }
  const [editFormData, setEditFormData] = useState({ title: '', time: '', calories: '', tags: '', img: '', ingredients: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSearchingExt, setIsSearchingExt] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState(null); // The meal object currently being viewed

  // Ensure the meal plan is synced with the current week on mount
  useEffect(() => {
    const getWeekCommencingDateLocal = () => {
      const today = new Date();
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - distanceToMonday);
      
      const yyyy = monday.getFullYear();
      const mm = String(monday.getMonth() + 1).padStart(2, '0');
      const dd = String(monday.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const currentWeek = getWeekCommencingDateLocal();
    if (mealPlan && mealPlan.weekCommencing !== currentWeek) {
      console.log("Meal plan week is out of date. Resetting to current week:", currentWeek);
      resetMealPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const term = editFormData.title.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingExt(true);
      
      try {
        const suggestions = await getUnifiedSuggestions(term);
        setSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (err) {
        console.error('Unified suggestion fetch error:', err);
        setSuggestions([]);
      } finally {
        setIsSearchingExt(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [editFormData.title]);

  const handleTitleChange = (val) => {
    setEditFormData({ ...editFormData, title: val });
  };

  const handleSelectSuggestion = async (suggestion) => {
    setShowSuggestions(false);

    const key = suggestion.title.toLowerCase();

    // Case 1: Local Database
    if (suggestion.source === 'Local' && culinaryDataBank[key]) {
      const dish = culinaryDataBank[key];
      setEditFormData({
        title: dish.title,
        time: dish.time || '30 mins',
        calories: dish.calories || '450',
        tags: dish.tags ? dish.tags.join(', ') : '',
        img: getDishImage(key, 0),
        ingredients: dish.ingredients || [],
        source: 'Local'
      });
      return;
    }

    // Case 2: Supabase Database
    if (suggestion.source === 'Supabase' && suggestion.recipeData) {
      const dbRecipe = suggestion.recipeData;
      setEditFormData({
        title: dbRecipe.dish_name,
        time: dbRecipe.total_time_min ? `${dbRecipe.total_time_min} mins` : '30 mins',
        calories: '...', // Can be fetched or calculated later
        tags: dbRecipe.cuisine || '',
        img: dbRecipe.image_url || '',
        ingredients: dbRecipe.full_ingredients ? dbRecipe.full_ingredients.split('\n') : [],
        source: 'Supabase'
      });
      return;
    }

    // Case 3: External API (enrich if needed)
    setIsAiGenerating(true);
    setEditFormData({ ...editFormData, title: suggestion.title, time: 'Fetching details...', calories: '...' });
    
    try {
      let finalRecipe = suggestion;

      // Enrich MealDB if it's a thin card
      if (suggestion.source === 'TheMealDB' && !suggestion.ingredients?.length) {
        const enriched = await lookupMealDBById(suggestion.externalId);
        if (enriched) finalRecipe = enriched;
      }

      // If we don't have full data yet, use AI to fill the gaps based on the title
      if (!finalRecipe.time || !finalRecipe.calories || !finalRecipe.ingredients?.length) {
        const restrictions = storeRestrictions.map(r => r.name);
        const aiRecipe = await generateRecipe(finalRecipe.title, 'Global', restrictions);
        setEditFormData({
          title: finalRecipe.title,
          time: finalRecipe.time || aiRecipe.time,
          calories: finalRecipe.calories || aiRecipe.calories,
          tags: finalRecipe.tags?.length ? finalRecipe.tags.join(', ') : (aiRecipe.tags ? aiRecipe.tags.join(', ') : 'AI Enhanced'),
          img: finalRecipe.thumbnail || getDishImage(finalRecipe.title, 0),
          ingredients: finalRecipe.ingredients?.length ? finalRecipe.ingredients : (aiRecipe.ingredients || []),
          source: finalRecipe.source
        });
      } else {
        setEditFormData({
          title: finalRecipe.title,
          time: finalRecipe.time,
          calories: finalRecipe.calories,
          tags: finalRecipe.tags ? finalRecipe.tags.join(', ') : '',
          img: finalRecipe.thumbnail || getDishImage(finalRecipe.title, 0),
          ingredients: finalRecipe.ingredients,
          source: finalRecipe.source
        });
      }
    } catch (error) {
      console.error("External data enrichment failed", error);
      setEditFormData({ ...editFormData, title: suggestion.title, time: '30 mins', calories: '400' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAddClick = (day, type) => {
    setIsEditing({ day, type, isNew: true });
    setEditFormData({ title: '', time: '20 mins', calories: '400', tags: '', img: '', ingredients: [] });
  };

  const handleEditClick = (day, type, index) => {
    const meal = mealPlan[day][type][index];
    setIsEditing({ day, type, index });
    setEditFormData({ ...meal, tags: Array.isArray(meal.tags) ? meal.tags.join(', ') : '' });
  };

  const handleDeleteMeal = (day, type, index) => {
    const newPlan = { ...mealPlan };
    newPlan[day][type].splice(index, 1);
    setMealPlan(newPlan);
  };

  const handleSaveMeal = () => {
    if (editFormData.time === 'Generating...') return;

    if (activePlan === 'Taste' && isEditing.isNew && totalSavedMealsCount >= 1) {
      setShowPlannerUpgradeLock(true);
      return;
    }

    const newPlan = { ...mealPlan };
    let finalIngredients = editFormData.ingredients || [];
    
    // If ingredients are missing (e.g. manual type-in), try to find a local match
    if (!finalIngredients.length) {
      const localMatch = culinaryDataBank[editFormData.title.toLowerCase()];
      if (localMatch) {
        finalIngredients = localMatch.ingredients || [];
      }
    }

    const mealData = {
      ...editFormData,
      ingredients: finalIngredients,
      id: Date.now(),
      tags: typeof editFormData.tags === 'string' ? editFormData.tags.split(',').map(t => t.trim()).filter(t => t) : editFormData.tags,
      img: editFormData.img || getDishImage(editFormData.title)
    };

    if (isEditing.isNew) {
      newPlan[isEditing.day][isEditing.type].push(mealData);
    } else {
      newPlan[isEditing.day][isEditing.type][isEditing.index] = {
        ...newPlan[isEditing.day][isEditing.type][isEditing.index],
        ...mealData
      };
    }

    setMealPlan(newPlan);
    setIsEditing(null);
  };

  // Calculate Daily Stats
  const dailyStats = useMemo(() => {
    const dayMeals = [...mealPlan[selectedDay].breakfast, ...mealPlan[selectedDay].lunch, ...mealPlan[selectedDay].dinner];
    const calories = dayMeals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0);
    // Rough estimates for demo purposes
    const protein = Math.round(calories * 0.06); 
    const fiber = Math.round(calories * 0.015);

    // Calculate pantry utilization
    let mealsWithPantryMatches = 0;
    dayMeals.forEach(meal => {
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        const hasMatch = meal.ingredients.some(ing => 
          pantryItems.some(p => ing.toLowerCase().includes(p.name.toLowerCase()))
        );
        if (hasMatch) mealsWithPantryMatches++;
      }
    });

    return { calories, protein, fiber, pantryMatches: mealsWithPantryMatches };
  }, [mealPlan, selectedDay, pantryItems]);

  const handleAddShoppingItem = (e) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;
    const match = newShoppingItem.trim().match(/^([\d\/\s\-\.]+(?:cups?|tsps?|tbsps?|g|kg|ml|l|oz|lbs?|pcs|units?|large|small|medium|cloves?|tins?|cans?|pinches?|pinch)?)\s+(.*)$/i);
    const qty = match ? match[1].trim() : '1 unit';
    const rawName = match ? match[2].trim() : newShoppingItem.trim();
    const cleanName = cleanIngredientName(rawName) || rawName;
    addGroceryItem({ name: cleanName, quantity: qty });
    setNewShoppingItem('');
    setShowShopSuggestions(false);
  };

  const handleExportMealPlan = async () => {
    const dateStr = new Date().toLocaleDateString();
    
    // Calculate the Monday and Sunday dates of the current week
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const weekRange = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
    
    let content = `EPICUREAN AI - WEEKLY MEAL PLAN\n`;
    content += `Week: ${weekRange}\n`;
    content += `Generated on: ${dateStr}\n`;
    content += `==========================================\n\n`;
    
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const dayNamesFull = {
      'MON': 'Monday',
      'TUE': 'Tuesday',
      'WED': 'Wednesday',
      'THU': 'Thursday',
      'FRI': 'Friday',
      'SAT': 'Saturday',
      'SUN': 'Sunday'
    };
    
    daysOfWeek.forEach(dayId => {
      const dayName = dayNamesFull[dayId] || dayId;
      const dayDateObj = new Date(monday);
      const dayIndex = daysOfWeek.indexOf(dayId);
      dayDateObj.setDate(monday.getDate() + dayIndex);
      const dayDateStr = dayDateObj.getDate();
      const monthStr = dayDateObj.toLocaleString('default', { month: 'short' });
      
      content += `=== ${dayName.toUpperCase()} (${monthStr} ${dayDateStr}) ===\n`;
      
      const dayMeals = mealPlan[dayId] || { breakfast: [], lunch: [], dinner: [] };
      
      content += `[Breakfast]\n`;
      if (dayMeals.breakfast && dayMeals.breakfast.length > 0) {
        dayMeals.breakfast.forEach(m => {
          content += `- ${m.title} (${m.time} | ${m.calories} kcal)\n`;
        });
      } else {
        content += `- No breakfast recipes scheduled\n`;
      }
      
      content += `\n[Lunch]\n`;
      if (dayMeals.lunch && dayMeals.lunch.length > 0) {
        dayMeals.lunch.forEach(m => {
          content += `- ${m.title} (${m.time} | ${m.calories} kcal)\n`;
        });
      } else {
        content += `- No lunch recipes scheduled\n`;
      }
      
      content += `\n[Dinner]\n`;
      if (dayMeals.dinner && dayMeals.dinner.length > 0) {
        dayMeals.dinner.forEach(m => {
          content += `- ${m.title} (${m.time} | ${m.calories} kcal)\n`;
        });
      } else {
        content += `- No dinner recipes scheduled\n`;
      }
      
      content += `\n==========================================\n\n`;
    });
    
    content += `Generated by Epicurean AI Kitchen Coach`;

    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: 'Epicurean AI - Weekly Meal Plan',
          text: content,
          dialogTitle: 'Share Weekly Meal Plan'
        });
        return;
      } catch (err) {
        console.error("Native Share failed, falling back to clipboard:", err);
        try {
          const { Clipboard } = await import('@capacitor/clipboard');
          await Clipboard.write({ string: content });
          alert("The meal plan has been copied to your clipboard!");
          return;
        } catch (clipErr) {
          console.error("Clipboard fallback failed:", clipErr);
        }
      }
    }

    // Try sharing using Web Share API on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Epicurean AI - Weekly Meal Plan',
          text: content
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Web Share failed, trying clipboard/download fallback:", err);
        } else {
          return; // User cancelled the share dialog
        }
      }
    }

    // Desktop/Fallback: Copy to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        alert("The meal plan has been copied to your clipboard!");
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
    
    // Desktop / Fallback: Download text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly_meal_plan_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Trigger print fallback
    document.body.classList.add('print-meal-plan');
    window.print();
    setTimeout(() => document.body.classList.remove('print-meal-plan'), 500);
  };

  const handleExportShoppingList = async () => {
    if (cleanedGroceryList.length === 0) {
      alert("Your shopping list is empty!");
      return;
    }
    
    const date = new Date().toLocaleDateString();
    const content = `EPICUREAN AI - SHOPPING LIST (${date})\n` +
      `==========================================\n\n` +
      cleanedGroceryList.map(item => `[ ${item.checked ? 'x' : ' '} ] ${item.name}`).join('\n') +
      `\n\nGenerated by Epicurean AI Kitchen Coach`;
    
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: 'Epicurean AI - Shopping List',
          text: content,
          dialogTitle: 'Share Shopping List'
        });
        return;
      } catch (err) {
        console.error("Native Share failed, falling back to clipboard:", err);
        try {
          const { Clipboard } = await import('@capacitor/clipboard');
          await Clipboard.write({ string: content });
          alert("The shopping list has been copied to your clipboard!");
          return;
        } catch (clipErr) {
          console.error("Clipboard fallback failed:", clipErr);
        }
      }
    }

    // Try sharing using Web Share API on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Epicurean AI - Shopping List',
          text: content
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Web Share failed, trying clipboard/download fallback:", err);
        } else {
          return; // User cancelled
        }
      }
    }

    // Desktop/Fallback: Copy to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        alert("The shopping list has been copied to your clipboard!");
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }

    // Desktop / Fallback: Download text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopping_list_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAiSuggestPlan = async () => {
    if (activePlan === 'Taste') {
      setShowPlannerUpgradeLock(true);
      return;
    }
    setIsAiPlanning(true);
    try {
      const restrictions = storeRestrictions.map(r => r.name);
      const cuisinePref = userProfile?.cuisinePreferences?.[0] || 'Global';
      const newPlan = await generateWeeklyPlan(restrictions, cuisinePref, savedRecipes);
      
      // Transform plan data to include unique IDs and default images
      const transformedPlan = {};
      const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      
      // Seed default structure
      daysOfWeek.forEach(day => {
        transformedPlan[day] = { breakfast: [], lunch: [], dinner: [] };
      });

      if (newPlan && typeof newPlan === 'object') {
        if (newPlan.weekCommencing) {
          transformedPlan.weekCommencing = newPlan.weekCommencing;
        }
        
        for (const rawDay of Object.keys(newPlan)) {
          const day = rawDay.toUpperCase();
          if (daysOfWeek.includes(day) && newPlan[rawDay]) {
            const getMealArray = (mealData) => {
              if (!mealData) return [];
              if (Array.isArray(mealData)) return mealData;
              return [mealData];
            };

            const convertMealAsync = async (m, index) => {
              if (!m || typeof m !== 'object') return null;
              
              let img = m.img && !m.img.includes('/assets/') ? m.img : null;
              if (!img) {
                img = await fetchDishImageFromUnsplash(m.title);
              }
              
              // 2. Fallback to local only if Unsplash completely fails (no key or rate limited)
              if (!img) {
                 img = m.img || getDishImage(m.title || 'Dish', index);
              }
              
              return {
                id: m.id || Math.random(),
                title: m.title || 'Untitled Dish',
                time: m.time || '25 mins',
                calories: m.calories || '450',
                tags: Array.isArray(m.tags) ? m.tags : ['AI Choice'],
                ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
                instructions: Array.isArray(m.instructions) ? m.instructions : [],
                img: img,
                source: m.source || 'AI'
              };
            };

            transformedPlan[day] = {
              breakfast: (await Promise.all(getMealArray(newPlan[rawDay].breakfast).map((m, idx) => convertMealAsync(m, idx)))).filter(Boolean),
              lunch: (await Promise.all(getMealArray(newPlan[rawDay].lunch).map((m, idx) => convertMealAsync(m, idx)))).filter(Boolean),
              dinner: (await Promise.all(getMealArray(newPlan[rawDay].dinner).map((m, idx) => convertMealAsync(m, idx)))).filter(Boolean)
            };
          }
        }
      }

      setMealPlan(transformedPlan);
    } catch (error) {
      console.error("Failed to generate AI plan", error);
      alert("We encountered an issue preparing your custom culinary plan. Please check your network connection and try again.");
    } finally {
      setIsAiPlanning(false);
    }
  };

  const handleResetPlan = () => {
    resetMealPlan();
    setShowResetConfirm(false);
  };

  const currentMeals = mealPlan[selectedDay];

  const MealCard = ({ meal, day, type, index }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => setViewingRecipe(meal)}
      className="group relative bg-surface-container-high rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 border-primary cursor-pointer"
    >
      <div className="flex h-32">
        <div className="w-1/3 relative overflow-hidden bg-gradient-to-br from-primary/30 to-tertiary/30 flex items-center justify-center">
          {(!meal.img || meal.img.includes('loremflickr.com')) ? (
            <span className="text-on-surface text-4xl font-bold opacity-30 uppercase tracking-widest absolute">
              {meal.title.charAt(0)}
            </span>
          ) : (
            <img alt={meal.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 absolute inset-0" src={meal.img} />
          )}
        </div>
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-body-lg text-on-surface line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">{meal.title}</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant">{meal.time} • {meal.calories} kcal</p>
          </div>
          <div className="flex gap-2">
            {meal.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-label-sm font-label-sm">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Action Overlays - keeping edit/delete buttons separate but accessible */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); handleEditClick(day, type, index); }}
          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm text-on-surface flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all"
          title="Edit Meal"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDeleteMeal(day, type, index); }}
          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-all"
          title="Delete Meal"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </motion.div>
  );

  const MealSection = ({ title, type, colorClass }) => (
    <div>
      <div className="flex items-center gap-4 mb-gutter">
        <h2 className={`font-headline-md text-headline-md ${colorClass}`}>{title}</h2>
        <div className="h-[1px] flex-grow bg-outline-variant"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <AnimatePresence mode="popLayout">
          {currentMeals[type].map((meal, index) => (
            <MealCard key={meal.id} meal={meal} day={selectedDay} type={type} index={index} />
          ))}
        </AnimatePresence>
        
        <button 
          onClick={() => handleAddClick(selectedDay, type)}
          className="border-2 border-dashed border-outline-variant rounded-xl h-32 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined text-4xl mb-1 group-hover:scale-110 transition-transform">add_circle</span>
          <span className="text-label-sm font-label-sm font-medium">Add {title} Recipes</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen pb-24 mt-16">
      <main className="max-w-[1280px] mx-auto px-container-margin py-base md:py-md">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-gutter mb-lg no-print">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Weekly Plan</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Manage your culinary schedule for the week.</p>
            <div className="bg-gradient-to-r from-primary-container to-tertiary-container text-on-surface px-4 py-2.5 rounded-xl inline-flex items-center gap-3 mt-4 border border-outline-variant shadow-md">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              <span className="font-label-lg text-label-lg font-bold">Tip: Press the cart icon to instantly order items on BigBasket, Blinkit, Zepto, or Instamart.</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-sm">
            <button 
              onClick={handleExportMealPlan}
              className="h-[48px] px-6 bg-surface-container-high text-on-surface font-label-md text-label-md rounded-xl flex items-center gap-2 hover:bg-surface-container-highest transition-all active:scale-95 border border-outline-variant"
            >
              <span className="material-symbols-outlined">download</span>
              Export Meal Plan
            </button>
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="h-[48px] px-6 bg-error/10 text-error font-label-md text-label-md rounded-xl flex items-center gap-2 hover:bg-error/20 transition-all active:scale-95 border border-error/20"
            >
              <span className="material-symbols-outlined">delete_sweep</span>
              Reset Plan
            </button>
            <button 
              disabled={isAiPlanning}
              onClick={handleAiSuggestPlan}
              className="h-[48px] px-6 bg-primary text-on-primary font-label-md text-label-md rounded-xl flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {isAiPlanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  Planning...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI Suggested Plan
                </>
              )}
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 space-y-gutter main-planner-content no-print-list">
            {/* Weekly Calendar Nav */}
            <div className="bg-surface-container-low p-4 rounded-2xl shadow-sm overflow-x-auto hide-scrollbar">
              <div className="flex gap-3 min-w-max">
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all duration-300 ${
                      selectedDay === day.id 
                        ? 'bg-primary text-on-primary shadow-md scale-105' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className="text-label-sm font-bold opacity-70">{day.label}</span>
                    <span className="text-headline-sm font-headline-sm">{day.date}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Meal Sections */}
            <div className="space-y-lg">
              <MealSection title="Breakfast" type="breakfast" colorClass="text-primary" />
              <MealSection title="Lunch" type="lunch" colorClass="text-secondary" />
              <MealSection title="Dinner" type="dinner" colorClass="text-tertiary" />
            </div>
          </div>

          {/* Side Rail */}
          <aside className="lg:col-span-4 space-y-gutter">
            <div className="glass-panel p-md rounded-2xl border border-white/40 shadow-xl bg-surface/50 no-print-list">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h3 className="font-headline-md text-headline-md text-primary">Daily Forecast</h3>
              </div>
              <p className="text-body-md text-on-surface-variant mb-6">
                {dailyStats.calories > 0 
                  ? `Your ${selectedDay} plan looks balanced! You've utilized your pantry for ${dailyStats.pantryMatches} of your meals today.`
                  : `Your ${selectedDay} plan is empty. Start adding recipes to see your daily forecast!`}
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Calories', val: dailyStats.calories, max: 2000, color: 'bg-primary' },
                  { label: 'Protein', val: dailyStats.protein, max: 150, color: 'bg-secondary' },
                  { label: 'Fiber', val: dailyStats.fiber, max: 35, color: 'bg-tertiary' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-label-sm font-label-sm text-on-surface">
                      <span>{stat.label}</span>
                      <span>{stat.val} / {stat.max}</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className={`${stat.color} h-full transition-all duration-1000`} style={{ width: `${Math.min((stat.val/stat.max)*100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-high p-md rounded-2xl shadow-sm shopping-list-card no-print-plan">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface">Shopping List</h3>
                <button 
                  onClick={handleExportShoppingList}
                  className="w-8 h-8 rounded-full hover:bg-surface-container-highest transition-colors flex items-center justify-center text-on-surface-variant no-print"
                  title="Export List PDF"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
              </div>
              
              <form onSubmit={handleAddShoppingItem} className="relative mb-4 no-print">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newShoppingItem}
                    onChange={(e) => handleShoppingInputChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowShopSuggestions(false), 150)}
                    onFocus={() => newShoppingItem.length > 1 && shopSuggestions.length > 0 && setShowShopSuggestions(true)}
                    placeholder="Type an ingredient..."
                    className="flex-1 bg-surface-container-highest border border-outline-variant rounded-full px-4 py-2 text-label-md focus:outline-none focus:ring-1 focus:ring-primary"
                    autoComplete="off"
                  />
                  <button type="submit" className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                {/* Autocomplete Dropdown */}
                {showShopSuggestions && (
                  <div className="absolute left-0 right-12 top-full mt-1 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl z-20 overflow-hidden">
                    {shopSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => handleSelectShopSuggestion(s)}
                        className="w-full text-left px-4 py-2 text-label-md text-on-surface hover:bg-primary/10 flex items-center gap-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-primary opacity-70">grocery</span>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </form>

              <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cleanedGroceryList.length > 0 ? (
                  cleanedGroceryList.slice(0, 8).map((item) => (
                    <li key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-highest transition-colors group border-b border-outline-variant/10 last:border-0">
                      <button onClick={() => toggleGroceryItem(item.id)} className="flex-1 flex items-center gap-3 cursor-pointer text-left">
                        <span className={`material-symbols-outlined text-lg ${item.checked ? 'text-secondary' : 'text-outline-variant'} transition-all`} style={item.checked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          {item.checked ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={`text-body-md ${item.checked ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{item.name}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOrderItem(item);
                          setIsDeliveryModalOpen(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary/10 text-secondary transition-all no-print"
                        title={`Order ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeGroceryItem(item.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-error-variant transition-all no-print"
                        title="Remove item"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="text-body-sm text-on-surface-variant italic py-4 text-center">No items yet.</li>
                )}
                {cleanedGroceryList.length > 8 && (
                  <li className="text-label-sm font-label-sm text-primary cursor-pointer hover:underline pt-2 text-center">+ {cleanedGroceryList.length - 8} more in Kitchen Hub</li>
                )}
              </ul>
            </div>
          </aside>
        </div>

        {/* Print-only Full Weekly Plan View */}
        <div className="hidden print-visible-block mt-8">
          <h2 className="text-3xl font-bold mb-6 text-center border-b-2 border-primary pb-3 text-primary">Weekly Culinary Schedule</h2>
          <div className="space-y-8">
            {days.map((day) => {
              const dayMeals = mealPlan[day.id] || { breakfast: [], lunch: [], dinner: [] };
              const hasAnyMeals = dayMeals.breakfast.length > 0 || dayMeals.lunch.length > 0 || dayMeals.dinner.length > 0;
              
              return (
                <div key={day.id} className="border border-outline-variant/30 rounded-2xl p-6 bg-surface-container-low page-break-inside-avoid shadow-sm mb-6">
                  <h3 className="text-xl font-bold mb-4 border-b border-outline-variant pb-2 text-primary flex justify-between">
                    <span>{day.label}</span>
                    <span className="text-outline font-normal text-sm">Date: {day.date}</span>
                  </h3>
                  {!hasAnyMeals ? (
                    <p className="text-on-surface-variant italic text-sm">No meals scheduled for this day.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                      <div>
                        <h4 className="font-bold text-base text-primary mb-2 border-b border-primary/20 pb-1">Breakfast</h4>
                        {dayMeals.breakfast.length > 0 ? (
                          <ul className="space-y-2 text-sm text-on-surface-variant">
                            {dayMeals.breakfast.map(m => (
                              <li key={m.id} className="bg-surface-container-high/40 p-2 rounded">
                                <span className="font-medium text-on-surface">{m.title}</span>
                                <div className="text-xs text-outline-variant">{m.time} | {m.calories} kcal</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-outline italic">None scheduled</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-secondary mb-2 border-b border-secondary/20 pb-1">Lunch</h4>
                        {dayMeals.lunch.length > 0 ? (
                          <ul className="space-y-2 text-sm text-on-surface-variant">
                            {dayMeals.lunch.map(m => (
                              <li key={m.id} className="bg-surface-container-high/40 p-2 rounded">
                                <span className="font-medium text-on-surface">{m.title}</span>
                                <div className="text-xs text-outline-variant">{m.time} | {m.calories} kcal</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-outline italic">None scheduled</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-tertiary mb-2 border-b border-tertiary/20 pb-1">Dinner</h4>
                        {dayMeals.dinner.length > 0 ? (
                          <ul className="space-y-2 text-sm text-on-surface-variant">
                            {dayMeals.dinner.map(m => (
                              <li key={m.id} className="bg-surface-container-high/40 p-2 rounded">
                                <span className="font-medium text-on-surface">{m.title}</span>
                                <div className="text-xs text-outline-variant">{m.time} | {m.calories} kcal</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-outline italic">None scheduled</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Quick Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-high p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="font-headline-lg text-headline-lg mb-6">
                {isEditing.isNew ? 'Add' : 'Edit'} {isEditing.type.charAt(0).toUpperCase() + isEditing.type.slice(1)}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="text-label-md font-label-md">Meal Title</label>
                  <input 
                    type="text" 
                    value={editFormData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Greek Salad"
                    className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl z-[110] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex flex-col">
                            <span className="font-label-md text-on-surface">
                              {s.title}
                            </span>
                            <span className="text-[10px] text-on-surface-variant opacity-70 uppercase tracking-tighter group-hover:text-primary transition-colors">
                              Add to Plan
                            </span>
                          </div>
                          <SourceBadge source={s.source} />
                        </button>
                      ))}
                      {isSearchingExt && (
                        <div className="px-4 py-3 flex items-center gap-2 text-outline text-[11px] animate-pulse bg-surface-container">
                          <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                          Searching global databases...
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-label-md font-label-md">Time</label>
                    <input 
                      type="text" 
                      value={editFormData.time}
                      onChange={(e) => setEditFormData({...editFormData, time: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-md font-label-md">Calories</label>
                    <input 
                      type="text" 
                      value={editFormData.calories}
                      onChange={(e) => setEditFormData({...editFormData, calories: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant rounded-xl outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-label-md font-label-md">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData({...editFormData, tags: e.target.value})}
                    placeholder="Vegan, High Protein..."
                    className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant rounded-xl outline-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={isAiGenerating}
                    onClick={() => setIsEditing(null)}
                    className="flex-grow px-6 py-3 border border-outline text-on-surface font-label-md rounded-xl hover:bg-surface-variant transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isAiGenerating}
                    onClick={handleSaveMeal}
                    className="flex-grow px-6 py-3 bg-primary text-on-primary font-label-md rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isAiGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : 'Save Meal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Recipe View Modal */}
      <AnimatePresence>
        {viewingRecipe && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingRecipe(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container-low rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="h-48 overflow-hidden relative">
                <img src={viewingRecipe.img} alt={viewingRecipe.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                  <h3 className="text-white font-display-md text-display-md">{viewingRecipe.title}</h3>
                </div>
                <button 
                  onClick={() => setViewingRecipe(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                <div className="flex gap-6 mb-8 text-on-surface-variant font-label-md">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    {viewingRecipe.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">local_fire_department</span>
                    {viewingRecipe.calories} kcal
                  </div>
                  {viewingRecipe.source && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary">source</span>
                      {viewingRecipe.source}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-headline-sm text-headline-sm mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">nutrition</span>
                      Ingredients
                    </h4>
                    <ul className="space-y-2">
                      {viewingRecipe.ingredients?.map((ing, i) => (
                        <li key={i} className="flex items-center gap-3 text-on-surface-variant">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-headline-sm text-headline-sm mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">restaurant_menu</span>
                      Preparation
                    </h4>
                    <div className="space-y-4">
                      {viewingRecipe.instructions?.length ? viewingRecipe.instructions.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="font-display-xs text-display-xs text-secondary/30 mt-0.5">{i + 1}</span>
                          <p className="text-on-surface-variant leading-relaxed">{step}</p>
                        </div>
                      )) : (
                        <p className="text-on-surface-variant italic">Full instructions available in the Kitchen Hub.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-high border-t border-outline-variant flex justify-end">
                <button 
                  onClick={() => setViewingRecipe(null)}
                  className="px-8 py-3 bg-primary text-on-primary font-label-md rounded-xl hover:shadow-lg active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-high p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg mb-4">Reset Weekly Plan?</h3>
              <p className="text-on-surface-variant font-body-md mb-8">
                This will clear all meals across every day. This action is permanent.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-6 py-3 border border-outline text-on-surface font-label-md rounded-xl hover:bg-surface-variant transition-colors"
                >
                  Keep Plan
                </button>
                <button 
                  onClick={handleResetPlan}
                  className="flex-1 px-6 py-3 bg-error text-on-error font-label-md rounded-xl hover:shadow-lg transition-all"
                >
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, aside, button, .no-print, .material-symbols-outlined { display: none !important; }
          body { background: white !important; color: black !important; margin: 0; padding: 20px; }
          main { pt: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .bg-surface-container-low, .bg-surface-container-high { background: #f5f5f5 !important; border: 1px solid #ddd !important; }
          .text-primary, .text-secondary, .text-tertiary { color: black !important; font-weight: bold !important; }
          .grid { display: block !important; }
          .rounded-xl, .rounded-2xl { border-radius: 4px !important; }
          .shadow-sm, .shadow-md, .shadow-lg { shadow: none !important; }
          .line-clamp-1 { -webkit-line-clamp: initial !important; }
          .h-32 { height: auto !important; min-height: 80px; margin-bottom: 10px; }
          .w-1/3 { width: 80px !important; height: 80px !important; }
          h1 { font-size: 24pt !important; margin-bottom: 20px !important; }
          h2 { font-size: 18pt !important; margin-top: 20px !important; border-bottom: 1px solid #eee; }
          .flex { display: flex !important; }
          .print-visible-block { display: block !important; }
          body.print-meal-plan .main-planner-content { display: none !important; }
        }
      `}} />
      {showPlannerUpgradeLock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-md no-print">
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-sm w-full text-center border border-outline-variant/30 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-4xl mb-4 animate-bounce">lock</span>
            <h4 className="font-headline-md text-headline-md mb-2">Upgrade Saved Slots</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Under our <strong>Taste (Free)</strong> plan, you can save exactly <strong>1 weekly meal plan slot</strong>. Upgrade to <strong>Savor</strong> or <strong>Feast</strong> to plan 7-day custom menus!
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowPlannerUpgradeLock(false)}
                className="px-4 py-2 border border-outline-variant rounded-full font-label-md hover:bg-surface-container-highest transition-all"
              >
                Close
              </button>
              <Link 
                to="/settings" 
                state={{ tab: 'subscription' }}
                className="px-5 py-2 bg-primary text-on-primary rounded-full font-label-md hover:scale-105 transition-transform active:scale-95 shadow-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isDeliveryModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsDeliveryModalOpen(false); setActiveOrderItem(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-high p-6 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 border border-outline-variant/20"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">shopping_cart</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Order via...</h3>
                </div>
                <button 
                  onClick={() => { setIsDeliveryModalOpen(false); setActiveOrderItem(null); }}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Description */}
              <p className="font-body-md text-sm text-on-surface-variant mb-5">
                {activeOrderItem ? (
                  <>Select an app to search for: <strong className="text-on-surface">"{activeOrderItem.name}"</strong></>
                ) : (
                  <>Select an app to search for your first item: <strong className="text-on-surface">"{uncheckedItems[0]?.name}"</strong></>
                )}
              </p>

              {/* Grid of Apps */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {deliveryApps.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => handleOrderAppClick(app)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 active:scale-95 ${app.bgColor}`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-2 bg-white rounded-xl p-2 shadow-sm border border-outline-variant/10">
                      <img src={app.logo} alt={`${app.name} logo`} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-label-lg text-sm font-semibold">{app.name}</span>
                  </button>
                ))}
              </div>

              {/* Reference list */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-[150px]">
                <h4 className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs mb-2">
                  Items to Order ({uncheckedItems.length})
                </h4>
                <div className="flex-1 overflow-y-auto bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 custom-scrollbar">
                  <ul className="space-y-1.5">
                    {uncheckedItems.map((item, idx) => (
                      <li key={item.id} className="font-body-md text-sm text-on-surface flex items-start gap-2">
                        <span className="text-on-surface-variant font-bold text-xs mt-0.5">{idx + 1}.</span>
                        <span>{item.name} {item.quantity ? <span className="text-on-surface-variant text-xs">({item.quantity})</span> : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-4 pt-6 mt-2 border-t border-outline-variant/30">
                <button 
                  onClick={() => { setIsDeliveryModalOpen(false); setActiveOrderItem(null); }}
                  className="w-full py-3 bg-primary text-on-primary font-label-lg rounded-2xl hover:shadow-lg transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyMealPlanner;


