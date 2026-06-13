import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRecipe } from '../services/aiService';
import { culinaryDataBank } from '../data/culinaryData';
import {
  fetchRecipesByIngredients,
  fetchRecipesByCuisine,
  lookupMealDBById,
  getApiStatus,
} from '../services/externalRecipeService';
import { getUnifiedSuggestions } from '../services/unifiedSearchService';
import { SUPPORTED_CUISINES, CUISINE_ICONS } from '../constants/cuisines';
import useAppStore from '../store/useAppStore';
import useTranslation from '../hooks/useTranslation';

// ─── Source Badge Component ───────────────────────────────────────────────────
const SourceBadge = ({ source }) => {
  const config = {
    TheMealDB  : { color: 'bg-amber-500/20  text-amber-400  border-amber-500/30',  label: 'MealDB'      },
    Spoonacular: { color: 'bg-green-500/20  text-green-400  border-green-500/30',  label: 'Spoonacular' },
  }[source] || { color: 'bg-surface-container text-outline border-outline-variant', label: source };

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>
      {config.label}
    </span>
  );
};

// ─── External Recipe Card ─────────────────────────────────────────────────────

// ─── External Recipe Card ─────────────────────────────────────────────────────
const ExternalRecipeCard = ({ recipe, onSelect }) => (
  <button
    onClick={() => onSelect(recipe)}
    className="group relative flex flex-col bg-surface-container rounded-xl overflow-hidden border border-outline-variant/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-left"
  >
    {/* Thumbnail */}
    <div className="relative h-36 overflow-hidden bg-surface-container-high">
      {recipe.thumbnail ? (
        <img
          src={recipe.thumbnail}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🍽️</div>
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {/* Source badge */}
      <div className="absolute top-2 right-2">
        <SourceBadge source={recipe.source} />
      </div>
      {/* Time badge */}
      {recipe.time && (
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/90 bg-black/40 rounded-full px-2 py-0.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {recipe.time}
        </span>
      )}
    </div>

    {/* Content */}
    <div className="p-3 flex-1 flex flex-col gap-1">
      <h4 className="font-semibold text-sm text-on-surface line-clamp-2 leading-tight group-hover:text-primary transition-colors">
        {recipe.title}
      </h4>
      {recipe.area && (
        <p className="text-[11px] text-outline flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">location_on</span>
          {recipe.area}
        </p>
      )}
      {recipe.usedCount !== undefined && (
        <p className="text-[11px] text-green-400 flex items-center gap-1 mt-auto">
          <span className="material-symbols-outlined text-[12px]">check_circle</span>
          {recipe.usedCount} ingredients matched
        </p>
      )}
    </div>

    {/* Hover CTA */}
    <div className="px-3 pb-3">
      <span className="text-[11px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
        Generate AI recipe from this
      </span>
    </div>
  </button>
);

// ─── API Status Bar ───────────────────────────────────────────────────────────
const ApiStatusBar = ({ status }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-[11px] text-outline font-medium">Powered by:</span>
    {[
      { key: 'mealDB',      label: 'TheMealDB',   icon: '🍳' },
      { key: 'spoonacular', label: 'Spoonacular', icon: '🥄' },
    ].map(({ key, label, icon }) => (
      <span
        key={key}
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
          status[key]
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-surface-container text-outline/50 border-outline-variant/30'
        }`}
      >
        {icon} {label}
        <span className="material-symbols-outlined text-[10px]">
          {status[key] ? 'check_circle' : 'cancel'}
        </span>
      </span>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AiRecipeGenerator = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const apiStatus = getApiStatus();
  const { userProfile, checkAndIncrementRecipeLimit } = useAppStore();
  const { t } = useTranslation();
  const userRestrictions = userProfile?.dietaryRestrictions || [];

  const [isGenerating, setIsGenerating]   = useState(false);
  const [showRecipeLimitLock, setShowRecipeLimitLock] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState(location.state?.cuisine || 'Italian');

  const [pantryItems, setPantryItems] = useState(() => {
    if (location.state?.pantryItems?.length > 0) return location.state.pantryItems;
    return [
      { name: 'Fresh Lemongrass', checked: true  },
      { name: 'Coconut Milk',     checked: true  },
      { name: "Bird's Eye Chili", checked: true  },
      { name: 'Chicken Breast',   checked: false },
    ];
  });

  const [newIngredient,   setNewIngredient]   = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingIndex,    setEditingIndex]    = useState(-1);
  const [editingValue,    setEditingValue]    = useState('');

  // ── Challenge / Deep Link Handling ──────────────────────────────────────────
  useEffect(() => {
    if (location.state?.initialQuery) {
      handleGenerate(location.state.initialQuery);
    }
  }, []);

  // ── External API state ──────────────────────────────────────────────────────
  const [externalRecipes,    setExternalRecipes]    = useState([]);
  const [cuisineRecipes,     setCuisineRecipes]     = useState([]);
  const [externalLoading,    setExternalLoading]    = useState(false);
  const [cuisineLoading,     setCuisineLoading]     = useState(false);
  const [activeTab,          setActiveTab]          = useState('ingredients'); // 'ingredients' | 'cuisine'

  // ── Local autocomplete ──────────────────────────────────────────────────────
  const allPossibleIngredients = useMemo(() => {
    const ings = new Set();
    Object.values(culinaryDataBank).forEach(dish => {
      dish.ingredients?.forEach(i => {
        const clean = i.replace(/^[0-9\/\.\s]+(cup|tbsp|tsp|g|kg|ml|lb|oz|unit|large|small|medium|slices|pieces|cloves)?\s+(of\s+)?/i, '').trim();
        if (clean.length > 2) ings.add(clean);
      });
    });
    return Array.from(ings);
  }, []);

  const suggestions = useMemo(() => {
    if (!newIngredient.trim() || newIngredient.length < 2) return [];
    return allPossibleIngredients
      .filter(ing => ing.toLowerCase().includes(newIngredient.toLowerCase()))
      .slice(0, 5)
      .map(name => ({ name, type: 'ingredient', source: 'Local' }));
  }, [newIngredient, allPossibleIngredients]);

  // ── External Suggestions logic ──────────────────────────────────────────────
  const [extSuggestions, setExtSuggestions] = useState([]);
  const [isSearchingExt, setIsSearchingExt] = useState(false);

  useEffect(() => {
    const term = newIngredient.trim();
    if (term.length < 3) {
      setExtSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingExt(true);
      try {
        const unifiedMatches = await getUnifiedSuggestions(term);
        setExtSuggestions(unifiedMatches);
      } catch (err) {
        console.error('Unified suggestion fetch error:', err);
      } finally {
        setIsSearchingExt(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [newIngredient]);

  const allSuggestions = [...suggestions, ...extSuggestions];

  // ── Fetch unified recipes by selected ingredients ───────────────────────────
  const refreshExternalByIngredients = useCallback(async () => {
    const active = pantryItems.filter(i => i.checked).map(i => i.name);
    if (active.length === 0) { setExternalRecipes([]); return; }
    setExternalLoading(true);
    try {
      const { results } = await getUnifiedFullSearch('', { ingredients: active, dietary: {}, maxTime: null }, 1);
      
      // Map unified schema (dish_name, image_url) to what ExternalRecipeCard expects (title, thumbnail)
      const mapped = results.slice(0, 8).map(r => ({
        id: r.id,
        title: r.dish_name,
        thumbnail: r.image_url || r.thumbnail,
        source: r.is_web ? r.source : 'Supabase',
        type: 'recipe',
        recipeData: r
      }));
      setExternalRecipes(mapped);
    } finally {
      setExternalLoading(false);
    }
  }, [pantryItems]);

  // ── Fetch external recipes by cuisine ───────────────────────────────────────
  const refreshExternalByCuisine = useCallback(async () => {
    setCuisineLoading(true);
    try {
      const results = await fetchRecipesByCuisine(selectedCuisine);
      setCuisineRecipes(results);
    } finally {
      setCuisineLoading(false);
    }
  }, [selectedCuisine]);

  // Auto-fetch when active tab or dependencies change
  useEffect(() => {
    if (activeTab === 'ingredients') refreshExternalByIngredients();
  }, [activeTab, refreshExternalByIngredients]);

  useEffect(() => {
    if (activeTab === 'cuisine') {
      setCuisineRecipes([]); // Clear old results to avoid stale data
      refreshExternalByCuisine();
    }
  }, [activeTab, selectedCuisine, refreshExternalByCuisine]);

  // ── Pantry actions ──────────────────────────────────────────────────────────
  const toggleIngredient = (index) => {
    if (editingIndex !== -1) return;
    const updated = [...pantryItems];
    updated[index].checked = !updated[index].checked;
    setPantryItems(updated);
  };

  const startEditing = (e, index) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingValue(pantryItems[index].name);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingValue.trim()) return;
    const updated = [...pantryItems];
    updated[editingIndex].name = editingValue.trim();
    setPantryItems(updated);
    setEditingIndex(-1);
  };

  const addIngredient = (e) => {
    if (e) e.preventDefault();
    if (!newIngredient.trim()) return;
    setPantryItems([...pantryItems, { name: newIngredient.trim(), checked: true }]);
    setNewIngredient('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (name) => {
    setPantryItems([...pantryItems, { name, checked: true }]);
    setNewIngredient('');
    setShowSuggestions(false);
  };

  const resetIngredients = () => setPantryItems(pantryItems.map(item => ({ ...item, checked: false })));

  const deleteIngredient = (e, index) => {
    e.stopPropagation();
    const updated = [...pantryItems];
    updated.splice(index, 1);
    setPantryItems(updated);
  };

  // ── AI generation ────────────────────────────────────────────────────────────
  const handleGenerate = async (overrideName = null) => {
    const isLimitOk = checkAndIncrementRecipeLimit();
    if (!isLimitOk) {
      setShowRecipeLimitLock(true);
      return;
    }

    setIsGenerating(true);
    try {
      const activeIngredients = overrideName
        ? [overrideName]
        : pantryItems.filter(item => item.checked).map(item => item.name);
      const recipeJson = await generateRecipe(activeIngredients, selectedCuisine, userRestrictions);
      navigate('/recipe', { state: { recipe: recipeJson } });
    } catch (error) {
      console.error(error);
      alert("We encountered an issue preparing your custom recipe. Please try again in a few moments.");
    } finally {
      setIsGenerating(false);
    }
  };

  // When user clicks an external card — enrich if possible, then generate AI version
  const handleExternalSelect = async (recipe) => {
    let dishName = recipe.title;

    // If it's a TheMealDB thin card (no ingredients yet), try to enrich
    if (recipe.source === 'TheMealDB' && recipe.externalId && !recipe.ingredients?.length) {
      const full = await lookupMealDBById(recipe.externalId);
      if (full) dishName = full.title;
    }

    handleGenerate(dishName);
  };

  const cuisines = SUPPORTED_CUISINES;
  const cuisineIcons = CUISINE_ICONS;

  const displayRecipes = activeTab === 'ingredients' ? externalRecipes : cuisineRecipes;
  const isLoading      = activeTab === 'ingredients' ? externalLoading : cuisineLoading;

  return (
    <main className="min-h-screen pb-32 mt-16 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="px-container-margin py-md">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile mb-2">{t('recipe_generator')}</h1>
        <p className="font-body-md text-on-surface-variant max-w-md mb-3">
          {t('genie_craft_desc')}
        </p>
        <ApiStatusBar status={apiStatus} />
      </section>

      <div className="px-container-margin grid grid-cols-4 gap-gutter">

        {/* ── Cuisine Selector ──────────────────────────────────────────────── */}
        <div className="col-span-4 bg-surface-container rounded-xl p-md shadow-[0_-4px_12px_rgba(26,25,21,0.04)] overflow-hidden">
          <h3 className="font-label-md text-label-md uppercase mb-sm text-outline">{t('select_cuisine')}</h3>
          <div className="flex gap-sm overflow-x-auto pb-4 pt-2 custom-scrollbar snap-x">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-4 py-2 rounded-full font-label-md flex-shrink-0 flex items-center gap-2 transition-all duration-200 snap-center ${
                  selectedCuisine === cuisine
                    ? 'bg-primary-container text-on-primary-container shadow-md scale-105 ring-2 ring-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant hover:scale-105'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {cuisineIcons[cuisine] || 'restaurant'}
                </span>
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* ── Left: Pantry ─────────────────────────────────────────────────── */}
        <div className="col-span-4 md:col-span-2 bg-surface-container-low border border-outline-variant/30 rounded-xl p-md">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label-md text-label-md text-on-surface">{t('current_pantry')}</h3>
            <button onClick={resetIngredients} className="text-primary font-label-sm hover:opacity-70">{t('reset_list')}</button>
          </div>

          {/* Add ingredient input */}
          <div className="relative mb-4">
            <form onSubmit={addIngredient} className="flex gap-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => { setNewIngredient(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('add_ingredient_placeholder')}
                className="flex-1 bg-surface border border-outline-variant rounded-full px-4 py-2 text-label-md focus:outline-none focus:border-primary"
              />
              <button type="submit" className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                <span className="material-symbols-outlined">add</span>
              </button>
            </form>

            {showSuggestions && allSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-12 mt-1 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl z-20 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                {suggestions.length > 0 && (
                  <div className="px-4 py-2 bg-surface-container text-[10px] font-bold text-outline uppercase tracking-wider border-b border-outline-variant/10">
                    Pantry Ingredients
                  </div>
                )}
                {suggestions.map((s) => (
                  <button
                    key={`local-${s.name}`}
                    onClick={() => handleSelectSuggestion(s.name)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors text-label-md text-on-surface flex items-center justify-between"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-outline">Local</span>
                  </button>
                ))}

                {extSuggestions.length > 0 && (
                  <div className="px-4 py-2 bg-surface-container text-[10px] font-bold text-outline uppercase tracking-wider border-b border-outline-variant/10 mt-1">
                    Global Dishes & Recipes
                  </div>
                )}
                {extSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => s.type === 'deep-link' ? window.open(s.sourceUrl, '_blank') : handleExternalSelect(s)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors text-label-md text-on-surface flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{s.title}</span>
                      <span className="text-[10px] text-outline group-hover:text-primary transition-colors">
                        Generate AI Recipe
                      </span>
                    </div>
                    <SourceBadge source={s.source} />
                  </button>
                ))}
                
                {isSearchingExt && (
                  <div className="px-4 py-3 flex items-center gap-2 text-outline text-[11px] animate-pulse">
                    <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                    Searching external databases...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pantry items */}
          <div className="space-y-3">
            {pantryItems.map((item, i) => (
              <div
                key={i}
                onClick={() => toggleIngredient(i)}
                className={`flex items-center justify-between p-3 rounded-lg group cursor-pointer transition-all ${
                  item.checked
                    ? 'bg-surface shadow-sm border border-secondary/20'
                    : 'bg-surface/50 border border-dashed border-outline-variant opacity-60'
                }`}
              >
                {editingIndex === i ? (
                  <form onSubmit={saveEdit} className="flex-1 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-surface border border-primary rounded px-2 py-1 text-body-md focus:outline-none"
                    />
                    <button type="submit" className="text-secondary font-label-sm">Save</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingIndex(-1); }} className="text-outline font-label-sm">Cancel</button>
                  </form>
                ) : (
                  <>
                    <span className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined transition-colors ${item.checked ? 'text-secondary' : 'text-outline'}`}
                        style={item.checked ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {item.checked ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className={`font-body-md ${item.checked ? 'text-on-surface' : 'text-on-surface-variant'}`}>{item.name}</span>
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(e, i)}
                        className="p-1 hover:bg-surface-container rounded-full"
                      >
                        <span className="material-symbols-outlined text-[18px] text-outline">edit</span>
                      </button>
                      <button
                        onClick={(e) => deleteIngredient(e, i)}
                        className="p-1 hover:bg-error-container/20 rounded-full"
                      >
                        <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                      </button>
                    </div>
                  </>
                )}
                <input checked={item.checked} onChange={() => toggleIngredient(i)} className="hidden" type="checkbox" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Image + CTA ────────────────────────────────────────────── */}
        <div className="col-span-4 md:col-span-2 flex flex-col gap-gutter">
          <div className="h-48 rounded-xl overflow-hidden relative group">
            <img
              alt="Cuisine Inspiration"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfYw_crt2PJvQrTG490SBernuCBm1KNba3ELkYVrx2vVV-7zbxTqZ7yXdz7fTf1PZWElCJzHLjvI7jh1OrYm7TfZGH2T0NBRWeLx4tzWmSxfQZcoIzIWMo8lD0ogy1WNXwVPjn47EH5CxvLW9J_LDtOouctkLqh5TzwpjdQ5DwY-s583-ALOarBqalZ2b6iwZ_QfHfwsOVyynWh3Ubw4r7H-HRKzGUhrLboMkrLmG5lPE9MyYaIitiSwt1Xno10BxNPPU6zGYEn0Q"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-label-sm text-surface-bright/80">Current Inspiration</p>
              <h4 className="font-headline-md">{selectedCuisine} Night Market</h4>
            </div>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="w-full h-16 bg-primary text-on-primary rounded-full font-label-md flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all relative overflow-hidden group disabled:opacity-70 disabled:active:scale-100"
          >
            {isGenerating
              ? <span className="animate-spin material-symbols-outlined relative z-10">autorenew</span>
              : <span className="material-symbols-outlined relative z-10">auto_awesome</span>
            }
            <span className="relative z-10">{isGenerating ? t('cooking_magic') : t('generate_ai_recipe')}</span>
          </button>
        </div>

        {/* ── External Recipe Discovery ─────────────────────────────────────── */}
        <div className="col-span-4 mt-2">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 mb-4 bg-surface-container rounded-xl p-1">
            {[
              { key: 'ingredients', label: t('by_ingredients'), icon: 'kitchen' },
              { key: 'cuisine',     label: `${selectedCuisine} Dishes`,    icon: 'globe_asia' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-label-md text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'text-on-surface-variant hover:bg-outline-variant/30'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-headline-sm text-on-surface text-base font-semibold">
                {activeTab === 'ingredients' ? t('make_now') : `Popular ${selectedCuisine} Dishes`}
              </h3>
              <p className="text-[12px] text-outline mt-0.5">
                {t('tap_card_desc')}
              </p>
            </div>
            <button
              onClick={activeTab === 'ingredients' ? refreshExternalByIngredients : refreshExternalByCuisine}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-surface-container transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <span className={`material-symbols-outlined text-[18px] text-outline ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-surface-container rounded-xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-surface-container-high" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-surface-container-high rounded w-3/4" />
                    <div className="h-2 bg-surface-container-high rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayRecipes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
              {displayRecipes.map(recipe => (
                <ExternalRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={handleExternalSelect}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">search_off</span>
              <p className="text-on-surface-variant font-body-md">
                {activeTab === 'ingredients'
                  ? 'Check some ingredients above and hit refresh'
                  : `No ${selectedCuisine} dishes found. Try another cuisine.`}
              </p>
            </div>
          )}
        </div>

      {/* Global AI Generation Overlay */}
      <AnimatePresence>
        {isGenerating && (
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
              <span className="material-symbols-outlined !text-6xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <motion.h3 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-headline-lg text-headline-lg text-on-surface"
            >
              {t('crafting_recipe')}
            </motion.h3>
            <p className="text-on-surface-variant font-body-lg mt-2">Adjusting flavors and calculating proportions</p>
          </motion.div>
        )}
      </AnimatePresence>

      {showRecipeLimitLock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-md">
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-sm w-full text-center border border-outline-variant/30 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-4xl mb-4 animate-bounce">lock</span>
            <h4 className="font-headline-md text-headline-md mb-2">Daily Limit Reached</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              You've used your <strong>3 free AI recipes</strong> for today under the <strong>Taste</strong> plan. Upgrade to <strong>Savor</strong> or <strong>Feast</strong> for unlimited premium recipe generations!
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowRecipeLimitLock(false)}
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

      </div>
    </main>
  );
};

export default AiRecipeGenerator;
