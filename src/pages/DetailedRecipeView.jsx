import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslation from '../hooks/useTranslation';
import useAppStore from '../store/useAppStore';
import { Capacitor } from '@capacitor/core';
import { generateRecipe } from '../services/aiService';
import { getDishImage, isStrictDishImage } from '../data/culinaryData';
import { getDishImageWaterfall } from '../services/imageWaterfallService';

const parseDetailedRecipe = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  
  const lines = rawText.replace(/\r/g, '').split('\n');
  const equipment = [];
  const parsedIngredients = [];
  const parsedSteps = [];
  const introText = [];
  const tips = [];
  
  let currentSection = 'intro'; // 'intro', 'equipment', 'ingredients', 'steps-body', 'tips'
  let currentStep = null;

  const isDivider = (str) => /^[=\-\s*_#\+]+$/.test(str);

  // Splits an ingredient/equipment line list, preferring ';' when present
  // (new machine-generated recipe format), falling back to ',' otherwise.
  const splitList = (str) => {
    const bySeparator = str.includes(';')
      ? str.split(/;\s*/)
      : str.split(/,\s*(?![^()]*\))/);

    // A '. ' followed by a capital letter often glues a trailing item onto the
    // next inline sub-header, e.g. "...ginger-garlic). MAKHANI SAUCE: butter...".
    const parts = [];
    bySeparator.forEach(chunk => {
      chunk.split(/\.\s+(?=[A-Z])/).forEach(piece => {
        const clean = piece.trim();
        if (clean) parts.push(clean);
      });
    });
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    let trimmed = lines[i].trim();
    if (!trimmed) continue;
    
    let upper = trimmed.toUpperCase();
    
    // Check if line is equipment header
    const equipMatch = trimmed.match(/^equipment(?:\s+you\s+(?:will\s+)?need)?:?\s*(.*)$/i);
    if (equipMatch) {
      currentSection = 'equipment';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      
      const rest = equipMatch[1].trim();
      if (rest) {
        splitList(rest).forEach(item => {
          const clean = item.replace(/^[\-\*\s•]+\s*/, '');
          if (clean) equipment.push(clean);
        });
      }
      continue;
    }

    // Check if line is ingredients header
    const ingredientsMatch = trimmed.match(/^ingredients(?:\s+you\s+(?:will\s+)?need)?:?\s*(.*)$/i);
    if (ingredientsMatch) {
      currentSection = 'ingredients';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }

      const rest = ingredientsMatch[1].trim();
      if (rest) {
        splitList(rest).forEach(item => {
          if (item) parsedIngredients.push(item);
        });
      }
      continue;
    }
    
    // Check if line is method/instructions header
    const methodMatch = trimmed.match(/^(?:step-by-step\s+)?(?:method|instructions|steps|directions):?\s*(.*)$/i);
    if (methodMatch) {
      currentSection = 'steps-body';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      
      const rest = methodMatch[1].trim();
      if (!rest) continue;
      trimmed = rest;
      upper = rest.toUpperCase();
    }
    
    // Check if line is tips/storage header
    const tipsHeaderMatch = trimmed.match(/^(?:common\s+beginner\s+mistakes|serving|why\s+this\s+works|storage|notes|tips|beginner\s+tips?):?\s*(.*)$/i);
    if (tipsHeaderMatch) {
      currentSection = 'tips';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      tips.push(trimmed);
      continue;
    }

    // Trailing trivia/closer lines (e.g. "CULTURAL NOTE: ...", "THIS IS BUTTER CHICKEN...",
    // "THE ORIGIN STORY: ...") close out the steps section instead of being appended
    // to the last step.
    const isTrailingNote = /^cultural\s+note:?/i.test(trimmed)
      || /^this\s+is\s/i.test(trimmed)
      || /^THE\s+[A-Z][A-Z\s]*:/.test(trimmed);
    if (isTrailingNote) {
      currentSection = 'tips';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      tips.push(trimmed);
      continue;
    }

    // Check for STEP header or numbered step(s). Handles both "one step per line"
    // (e.g. "STEP 1 — MARINATE" / "1. Soak dry...") and the machine-generated format
    // where all steps run together on a single line (e.g. "1) Marinate...2) Sauce:...").
    const stepStartMatch = /^(?:step\s+)?\d+\s*[\.\)\]—\-:]\s*\S/i.test(trimmed);
    if (stepStartMatch) {
      currentSection = 'steps-body';

      const chunks = trimmed
        .split(/(?=(?:^|\s)(?:step\s+)?\d+\s*[\.\)\]—\-:]\s)/i)
        .map(c => c.trim())
        .filter(Boolean);

      chunks.forEach(chunk => {
        const stepMatch = chunk.match(/^(?:step\s+)?(\d+)\s*[\.\)\]—\-:]\s*(.*)$/i);
        if (!stepMatch) {
          // Continuation text with no leading step number - keep it with the current step.
          if (currentStep) currentStep.paragraphs.push(chunk);
          return;
        }

        if (currentStep) {
          parsedSteps.push(currentStep);
        }

        let rawRest = stepMatch[2] ? stepMatch[2].trim() : '';
        let title = '';
        let firstParagraph = '';

        const titleSeparator = rawRest.match(/^(.*?[a-zA-Z0-9])\s*(?::|—|-)\s+(.+)$/);
        if (titleSeparator) {
          const potentialTitle = titleSeparator[1].trim();
          const potentialPara = titleSeparator[2].trim();
          if (potentialTitle.split(/\s+/).length <= 6) {
            title = potentialTitle;
            firstParagraph = potentialPara;
          } else {
            firstParagraph = rawRest;
          }
        } else {
          const wordCount = rawRest.split(/\s+/).length;
          const isSentence = rawRest.endsWith('.') || rawRest.endsWith('!') || rawRest.endsWith('?');
          if (wordCount <= 6 && !isSentence) {
            title = rawRest;
          } else {
            firstParagraph = rawRest;
          }
        }

        currentStep = {
          number: parseInt(stepMatch[1], 10),
          title: title,
          paragraphs: firstParagraph ? [firstParagraph] : []
        };
      });
      continue;
    }
    
    if (isDivider(trimmed)) continue;
    
    if (currentSection === 'intro') {
      if (
        !upper.includes('BEGINNER MASTER RECIPE') &&
        !upper.includes('SERVES') &&
        !upper.includes('PREP:') &&
        !upper.includes('COOK:') &&
        !upper.includes('DIFFICULTY:') &&
        !upper.includes('SPICE:')
      ) {
        introText.push(trimmed);
      }
    } else if (currentSection === 'equipment') {
      const cleanEquip = trimmed.replace(/^[\-\*\s•]+\s*/, '');
      if (cleanEquip) equipment.push(cleanEquip);
    } else if (currentSection === 'ingredients') {
      const subheaderMatch = trimmed.match(/^(For\s+[^:]+):\s*(.*)$/i);
      if (subheaderMatch) {
        parsedIngredients.push(subheaderMatch[1] + ":");
        const rest = subheaderMatch[2].trim();
        if (rest) {
          const items = rest.split(/,\s*(?![^()]*\))/);
          items.forEach(item => {
            if (item.trim()) parsedIngredients.push(item.trim());
          });
        }
      } else {
        const hasMultipleQuantities = (trimmed.match(/\d+\s*(?:tbsp|tsp|g|kg|cup|cups|ml|oz|cloves|shallots|eggs|lbs?|pcs?|pieces)?\b/gi) || []).length > 1;
        if (trimmed.includes(',') && hasMultipleQuantities) {
          const items = trimmed.split(/,\s*(?![^()]*\))/);
          items.forEach(item => {
            if (item.trim()) parsedIngredients.push(item.trim());
          });
        } else {
          parsedIngredients.push(trimmed);
        }
      }
    } else if (currentSection === 'steps-body') {
      if (currentStep) {
        currentStep.paragraphs.push(trimmed);
      } else {
        introText.push(trimmed);
      }
    } else if (currentSection === 'tips') {
      tips.push(trimmed);
    }
  }
  
  if (currentStep) {
    parsedSteps.push(currentStep);
  }
  
  if (parsedSteps.length === 0) return null;
  
  return {
    intro: introText.join(' '),
    equipment,
    ingredients: parsedIngredients,
    steps: parsedSteps,
    tips
  };
};

const DetailedRecipeView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const rawRecipe = location.state?.recipe || {};
  
  const [currentRawRecipe, setCurrentRawRecipe] = useState(rawRecipe);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Try to parse rawDetailedRecipe text
  const rawDetailedText = currentRawRecipe.rawDetailedRecipe || 
    (Array.isArray(currentRawRecipe.instructions) ? currentRawRecipe.instructions.join('\n') : currentRawRecipe.instructions) || '';
  
  const parsedRecipeData = parseDetailedRecipe(rawDetailedText);

  const cleanImage = (url) => {
    if (!url || typeof url !== 'string' || url.includes('google.com') || url.includes('loremflickr.com')) return null;
    if (!isStrictDishImage(url)) return null;
    return url;
  };

  // Normalize recipe data structure
  const recipe = {
    title: currentRawRecipe.title || "Gourmet Dish",
    description: currentRawRecipe.description || (currentRawRecipe.isAuthentic ? "Authentic Recipe" : "AI Optimized"),
    prepTime: currentRawRecipe.prepTime || currentRawRecipe.time || "35 min",
    calories: currentRawRecipe.calories || 450,
    ingredients: (parsedRecipeData && parsedRecipeData.ingredients.length > 0) 
      ? parsedRecipeData.ingredients 
      : (Array.isArray(currentRawRecipe.ingredients) 
          ? currentRawRecipe.ingredients 
          : typeof currentRawRecipe.ingredients === 'string' 
            ? currentRawRecipe.ingredients.split(',').map(i=>i.trim()).filter(Boolean) 
            : []),
    instructions: (parsedRecipeData && parsedRecipeData.steps.length > 0)
      ? parsedRecipeData.steps.map(step => {
          const titlePrefix = step.title ? `**${step.title}**\n` : '';
          return `${titlePrefix}${step.paragraphs.join('\n')}`;
        })
      : (Array.isArray(currentRawRecipe.instructions) 
          ? currentRawRecipe.instructions 
          : typeof currentRawRecipe.instructions === 'string' && currentRawRecipe.instructions.trim().length > 0 
            ? currentRawRecipe.instructions.split('\n').map(i=>i.trim()).filter(Boolean) 
            : []),
    img: cleanImage(currentRawRecipe.img) || getDishImage(currentRawRecipe.title || "recipe") || null
  };

  const { savedRecipes, toggleSaveRecipe } = useAppStore();
  const [toastMessage, setToastMessage] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [unsplashImage, setUnsplashImage] = useState(null);
  const isSaved = savedRecipes.some(r => r.title === recipe.title);

  const isRealImage = recipe.img && isStrictDishImage(recipe.img) && !recipe.img.includes('/assets/');

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const fetchImg = async () => {
      if (isRealImage) return; // Skip if we have Wikipedia/DB image
      const img = await getDishImageWaterfall(recipe.title);
      if (img) setUnsplashImage(img);
    };
    fetchImg();
  }, [recipe.title, isRealImage]);

  const displayImage = isRealImage ? recipe.img : (unsplashImage || recipe.img);

  const stepsText = recipe.instructions && recipe.instructions.length > 0 
    ? `\n\nInstructions:\n${recipe.instructions.map((step, idx) => `${idx + 1}. ${step.replace(/\*\*/g, '')}`).join('\n\n')}`
    : '';

  const shareText = `Check out this delicious recipe: ${recipe.title}\nPrep Time: ${recipe.prepTime}\nCalories: ${recipe.calories} cal\n\nIngredients:\n${recipe.ingredients.map(i => `- ${i}`).join('\n')}${stepsText}\n\nPrepared using Epicurean Global AI Kitchen Coach!`;

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleFavoriteClick = () => {
    toggleSaveRecipe(recipe);
    triggerToast(isSaved ? 'Removed from favorites' : 'Added to favorites!');
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };
  const handleGenerateInstructions = async () => {
    setIsGenerating(true);
    try {
      // Pass the dish title and ingredients as an array so generateRecipe extracts dishName
      const generated = await generateRecipe([recipe.title, ...recipe.ingredients], 'Global', []);
      if (generated && generated.instructions) {
        setCurrentRawRecipe({
          ...currentRawRecipe,
          instructions: generated.instructions,
          ingredients: generated.ingredients || currentRawRecipe.ingredients
        });
        triggerToast('AI Recipe Generated!');
      } else {
        triggerToast('Failed to generate recipe');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error generating recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-40">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full shadow-lg font-label-md text-label-md flex items-center gap-2 transition-all duration-300 print:hidden">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toastMessage.includes('Added') || toastMessage.includes('copied') || toastMessage.includes('Copied') ? 'check_circle' : 'info'}
          </span>
          {toastMessage}
        </div>
      )}

      {/* Premium Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 print:hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-surface-container-high p-8 rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl border border-outline-variant/30 overflow-hidden z-50"
            >
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-variant/20 flex items-center justify-center hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="text-center mb-6">
                <h3 className="font-display-sm text-display-sm text-primary dark:text-primary-fixed">Share Recipe</h3>
                <p className="text-on-surface-variant mt-1 text-body-md">Choose how you want to share this delicious culinary creation.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* WhatsApp */}
                <button 
                  onClick={async () => {
                    setIsShareModalOpen(false);
                    const isNative = Capacitor.isNativePlatform();
                    if (isNative) {
                      try {
                        const { Share } = await import('@capacitor/share');
                        await Share.share({
                          title: recipe.title,
                          text: shareText,
                          dialogTitle: 'Share via WhatsApp'
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    } else {
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-surface-container-highest hover:bg-primary/10 hover:text-primary transition-all group active:scale-95 shadow-sm border border-outline-variant/10 text-center"
                >
                  <span className="material-symbols-outlined text-[32px] text-emerald-500 group-hover:scale-110 transition-transform">chat</span>
                  <span className="font-label-md text-label-md">WhatsApp</span>
                </button>

                {/* Email */}
                <button 
                  onClick={async () => {
                    setIsShareModalOpen(false);
                    const isNative = Capacitor.isNativePlatform();
                    if (isNative) {
                      try {
                        const { Share } = await import('@capacitor/share');
                        await Share.share({
                          title: recipe.title,
                          text: shareText,
                          dialogTitle: 'Share via Email'
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    } else {
                      window.location.href = `mailto:?subject=${encodeURIComponent("Check out this recipe: " + recipe.title)}&body=${encodeURIComponent(shareText)}`;
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-surface-container-highest hover:bg-primary/10 hover:text-primary transition-all group active:scale-95 shadow-sm border border-outline-variant/10 text-center"
                >
                  <span className="material-symbols-outlined text-[32px] text-blue-500 group-hover:scale-110 transition-transform">mail</span>
                  <span className="font-label-md text-label-md">Email</span>
                </button>

                {/* Save as PDF or Native Share */}
                <button 
                  onClick={async () => {
                    setIsShareModalOpen(false);
                    const isNative = Capacitor.isNativePlatform();
                    if (isNative) {
                      try {
                        const { Share } = await import('@capacitor/share');
                        await Share.share({
                          title: recipe.title,
                          text: shareText,
                          dialogTitle: 'Share Recipe'
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    } else {
                      // Small delay to let modal close before print dialog opens
                      setTimeout(() => {
                        window.print();
                      }, 300);
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-surface-container-highest hover:bg-primary/10 hover:text-primary transition-all group active:scale-95 shadow-sm border border-outline-variant/10 text-center"
                >
                  <span className="material-symbols-outlined text-[32px] text-red-500 group-hover:scale-110 transition-transform">
                    {Capacitor.isNativePlatform() ? 'share' : 'picture_as_pdf'}
                  </span>
                  <span className="font-label-md text-label-md">
                    {Capacitor.isNativePlatform() ? 'Share Options' : 'Save as PDF'}
                  </span>
                </button>

                {/* Copy Text */}
                <button 
                  onClick={async () => {
                    setIsShareModalOpen(false);
                    const isNative = Capacitor.isNativePlatform();
                    try {
                      if (isNative) {
                        const { Clipboard } = await import('@capacitor/clipboard');
                        await Clipboard.write({ string: shareText });
                      } else {
                        await navigator.clipboard.writeText(shareText);
                      }
                      triggerToast('Recipe copied to clipboard!');
                    } catch (err) {
                      triggerToast('Copy failed');
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-surface-container-highest hover:bg-primary/10 hover:text-primary transition-all group active:scale-95 shadow-sm border border-outline-variant/10 text-center"
                >
                  <span className="material-symbols-outlined text-[32px] text-purple-500 group-hover:scale-110 transition-transform">content_copy</span>
                  <span className="font-label-md text-label-md">Copy Text</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Top AppBar for Recipe View */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-xl shadow-sm dark:shadow-none print:hidden">
        <div className="flex items-center justify-between px-gutter w-full max-w-7xl mx-auto h-16">
          <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-primary dark:text-primary-fixed tracking-tight truncate max-w-[50vw] text-center">Modern Kitchen</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleFavoriteClick} 
              className="active:scale-90 transition-transform duration-200 flex items-center justify-center p-1"
            >
              <span 
                className={`material-symbols-outlined transition-colors duration-200 cursor-pointer ${isSaved ? 'text-error' : 'text-on-surface-variant'}`}
                style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
            <button 
              onClick={handleShareClick} 
              className="active:scale-90 transition-transform duration-200 flex items-center justify-center p-1"
            >
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors duration-200">
                share
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative h-[442px] md:h-[530px] w-full overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-80 z-0 bg-gradient-to-br from-primary/30 to-tertiary/30 flex items-center justify-center">
            {(!displayImage || displayImage.includes('loremflickr.com')) ? (
              <span className="text-on-surface text-8xl font-bold opacity-30 uppercase tracking-widest absolute">
                {recipe.title.charAt(0)}
              </span>
            ) : (
              <img 
                src={displayImage}
                alt={recipe.title}
                className="w-full h-full object-cover absolute inset-0"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          </div>
          <div className="absolute bottom-6 left-container-margin right-container-margin md:left-1/2 md:-translate-x-1/2 md:max-w-4xl w-auto">
            <div className="glass-panel p-6 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{recipe.description}</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">{recipe.title}</h2>
              </div>
              <div className="flex items-center gap-6 border-l border-outline-variant/30 pl-6">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary mb-1">schedule</span>
                  <span className="font-label-md text-label-md">{recipe.prepTime}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary mb-1">local_fire_department</span>
                  <span className="font-label-md text-label-md">{recipe.calories} cal</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary mb-1">star</span>
                  <span className="font-label-md text-label-md">Medium</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Layout */}
        <div className="max-w-7xl mx-auto px-container-margin mt-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-xl">
            {/* Left Column: Ingredients */}
            <aside className="md:col-span-4 lg:col-span-3">
              <div className="sticky top-24">
                <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                  {t('ingredients')}
                  <span className="font-body-md text-body-md text-on-surface-variant font-normal">(4 {t('servings')})</span>
                </h3>
                <div className="space-y-4">
                  {recipe.ingredients.map((ingredient, i) => {
                    const trimmed = ingredient.trim();
                    if (!trimmed) return null;
                    
                    const isSubheader = !trimmed.startsWith('-') && !trimmed.startsWith('*') && (trimmed.endsWith(':') || trimmed.toLowerCase().startsWith('for '));
                    
                    if (isSubheader) {
                      return (
                        <div key={i} className="font-semibold text-primary dark:text-primary-fixed mt-4 mb-2 first:mt-0 px-1">
                          {trimmed.replace(/:$/, '')}
                        </div>
                      );
                    }
                    
                    const cleanLine = trimmed.replace(/^[\-\*\s•]+\s*/, '');
                    return (
                      <label key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer group">
                        <input className="mt-1 w-5 h-5 rounded border-outline text-secondary focus:ring-secondary transition-all" type="checkbox" />
                        <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">{cleanLine}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Equipment You Need sidebar window */}
                {parsedRecipeData && parsedRecipeData.equipment.length > 0 && (
                  <div className="mt-6 p-5 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <h4 className="font-label-lg text-label-lg text-primary dark:text-primary-fixed mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">construction</span>
                      Equipment You Need
                    </h4>
                    <ul className="space-y-2">
                      {parsedRecipeData.equipment.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recipe.ai_tip && (
                  <div className="mt-8 p-6 bg-secondary-container/20 rounded-xl border border-secondary/10">
                    <h4 className="font-label-md text-label-md text-secondary mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      {t('ai_diet_tip')}
                    </h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {recipe.ai_tip}
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* Right Column: Instructions */}
            <section className="md:col-span-8 lg:col-span-9">
              <h3 className="font-headline-md text-headline-md mb-8">{t('instructions')}</h3>
              <div className="space-y-12">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="font-headline-sm text-headline-sm text-primary">Generating detailed AI recipe...</p>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 text-center">Our culinary AI is writing step-by-step instructions for {recipe.title}.</p>
                  </div>
                ) : parsedRecipeData && parsedRecipeData.steps.length > 0 ? (
                  parsedRecipeData.steps.map((step, index) => (
                    <div key={index} className="flex gap-8 group">
                      <span className="font-display-lg text-display-lg text-primary/20 group-hover:text-primary transition-colors leading-none">
                        {step.number.toString().padStart(2, '0')}
                      </span>
                      <div className="pt-2">
                        <h4 className="font-headline-md text-headline-md mb-3">
                          {step.title ? step.title : `${t('step')} ${step.number}`}
                        </h4>
                        <div className="space-y-3 max-w-2xl">
                          {step.paragraphs.map((p, pIdx) => (
                            <p key={pIdx} className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : recipe.instructions && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-8 group">
                      <span className="font-display-lg text-display-lg text-primary/20 group-hover:text-primary transition-colors leading-none">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="pt-2">
                        <h4 className="font-headline-md text-headline-md mb-3">{t('step')} {index + 1}</h4>
                        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                          {instruction}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-center">
                    <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <h4 className="font-headline-md text-headline-md mb-3 text-on-surface">No Detailed Instructions Found</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-8">
                      This meal was added as a simple dish name. You can use our AI Kitchen Coach to generate a step-by-step master recipe instantly.
                    </p>
                    <button 
                      onClick={handleGenerateInstructions}
                      className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-lg hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                      Generate AI Recipe
                    </button>
                  </div>
                )}
              </div>

              {/* Chef's Secrets & Storage Tips */}
              {parsedRecipeData && parsedRecipeData.tips.length > 0 && (
                <div className="mt-16 p-6 bg-surface-container-high rounded-2xl border border-outline-variant/30 max-w-2xl shadow-sm">
                  <h4 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[24px]">lightbulb</span>
                    Chef's Secrets & Tips
                  </h4>
                  <div className="space-y-4">
                    {parsedRecipeData.tips.map((tip, idx) => {
                      const trimmed = tip.trim();
                      const isHeader = trimmed.endsWith(':') || trimmed.toUpperCase() === trimmed;
                      if (isHeader) {
                        return (
                          <h5 key={idx} className="font-label-lg text-label-lg text-secondary mt-4 first:mt-0">
                            {trimmed}
                          </h5>
                        );
                      }
                      const cleanTip = trimmed.replace(/^[\-\*\s•]+\s*/, '');
                      return (
                        <p key={idx} className="font-body-md text-body-md text-on-surface-variant pl-4 border-l-2 border-primary/30">
                          {cleanTip}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* AI Coach Floating Action Button */}
      <div className="fixed bottom-24 right-8 z-[60] print:hidden">
        <button 
          onClick={() => navigate('/voice-coach', { state: { recipe } })}
           className="flex items-center gap-3 bg-primary text-on-primary px-6 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          <span className="font-label-md text-label-md">{t('start_ai_coach')}</span>
        </button>
      </div>
    </div>
  );
};

export default DetailedRecipeView;
