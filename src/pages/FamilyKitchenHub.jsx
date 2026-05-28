import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import useAuthStore from '../store/useAuthStore';
import { Capacitor } from '@capacitor/core';
import { cleanIngredientName } from '../data/culinaryData';
import { getUnifiedFullSearch } from '../services/unifiedSearchService';
import { getSpoonacularRecipe, lookupMealDBById } from '../services/externalRecipeService';

const FamilyKitchenHub = () => {
  const activePlan = useAppStore(state => state.activePlan);
  const navigate = useNavigate();
  
  if (activePlan !== 'Feast') {
    return (
      <div className="pt-24 px-container-margin max-w-xl mx-auto text-center min-h-[80vh] flex flex-col justify-center items-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary text-4xl animate-pulse">lock</span>
        </div>
        <h2 className="font-display-md text-display-md mb-4 text-on-surface">Feast Tier Feature Only</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md">
          The collaborative <strong>Family Kitchen Hub</strong> is exclusive to our <strong>Feast</strong> tier subscribers. Upgrade to synchronize grocery shopping, plan weekly family meals, and invite up to 6 household members!
        </p>
        <Link 
          to="/settings" 
          state={{ tab: 'subscription' }}
          className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-lg hover:scale-105 transition-transform active:scale-95 shadow-md inline-block"
        >
          Upgrade to Feast
        </Link>
      </div>
    );
  }

  const { 
    familyId,
    createFamily,
    groceryList, 
    toggleGroceryItem, 
    addGroceryItem, 
    removeGroceryItem,
    checkedPlanItems,
    toggleCheckedPlanItem,
    familyMembers, 
    updateFamilyMember, 
    addFamilyMember, 
    deleteFamilyMember,
    dietaryRestrictions, 
    removeRestriction,
    mealPlan,
    pantryItems
  } = useAppStore();
  const { user } = useAuthStore();
  const [newItemName, setNewItemName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberFormData, setMemberFormData] = useState({ name: '', role: 'Contributor', avatar: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [isDietaryModalOpen, setIsDietaryModalOpen] = useState(false);
  const [newRestrictionInput, setNewRestrictionInput] = useState('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [activeOrderItem, setActiveOrderItem] = useState(null);

  const [isOpeningRecipe, setIsOpeningRecipe] = useState(false);

  const handleRecipeClick = async (meal) => {
    if (isOpeningRecipe) return;
    setIsOpeningRecipe(true);
    try {
      const results = await getUnifiedFullSearch(meal.title, { ingredients: [], dietary: {}, maxTime: null });
      if (results && results.length > 0) {
        let bestMatch = results[0];
        const exact = results.find(r => r.dish_name?.toLowerCase() === meal.title?.toLowerCase());
        if (exact) bestMatch = exact;

        if (bestMatch.is_web && (!bestMatch.full_ingredients || !bestMatch.detailed_recipe)) {
          let details = null;
          if (bestMatch.source === 'Spoonacular') {
            details = await getSpoonacularRecipe(bestMatch.externalId);
          } else if (bestMatch.source === 'TheMealDB') {
            details = await lookupMealDBById(bestMatch.externalId);
          }
          if (details) {
            bestMatch = {
              ...bestMatch,
              full_ingredients: details.ingredients?.join('\n') || '',
              detailed_recipe: details.instructions?.join('\n') || '',
              description: details.description || bestMatch.description,
            };
          }
        }
        
        const mappedRecipe = {
          title: bestMatch.dish_name || bestMatch.title,
          description: bestMatch.description || `A delicious recipe for ${bestMatch.dish_name || bestMatch.title}`,
          ingredients: bestMatch.full_ingredients
            ? bestMatch.full_ingredients.split('\n').map((s) => s.trim()).filter(Boolean)
            : [],
          img: bestMatch.image_url || bestMatch.thumbnail || meal.img,
          id: bestMatch.id || meal.id,
          cuisine: bestMatch.cuisine,
          difficulty: bestMatch.difficulty,
          rawDetailedRecipe: bestMatch.detailed_recipe
        };
        navigate('/recipe', { state: { recipe: mappedRecipe } });
        setIsOpeningRecipe(false);
        return;
      }
    } catch (err) {
      console.error('Error fetching recipe details:', err);
    } 
    setIsOpeningRecipe(false);
    navigate('/recipe', { state: { recipe: meal } });
  };

  const handleShareInvite = async (platform) => {
    setIsGeneratingLink(true);
    try {
      const link = await useAppStore.getState().generateInviteLinkAction();
      if (!link) throw new Error("Invite link generation returned empty.");
      setInviteLink(link);
      const message = `Join my Epicurean AI Kitchen Hub! Plan meals and shop together: ${link}`;
      
      const isNative = Capacitor.isNativePlatform();

      if (platform === 'copy') {
        if (isNative) {
          const { Clipboard } = await import('@capacitor/clipboard');
          await Clipboard.write({ string: link });
        } else {
          await navigator.clipboard.writeText(link);
        }
        alert("Invite link copied to clipboard!");
      } else {
        if (isNative) {
          const { Share } = await import('@capacitor/share');
          await Share.share({
            title: 'Epicurean AI Kitchen Hub Invite',
            text: message,
            url: link,
            dialogTitle: 'Share Invite Link'
          });
        } else {
          if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
          } else if (platform === 'telegram') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`, '_blank');
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate invite link: " + (error.message || "Check your database connection and RLS policies."));
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const avatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD6XcH7HDfNaG3ArkId61egAGX6nLRQOfnRmVHGdAvYZs48nr8x4T1oISbHv0fCndwbzm3PG9AvwkGHsLRKEAJBPbe3TplMzrjPm56uo0H4SXNw3qCL3PxkF7mg3FdvweE1pyoSsBiSKyvouKR8eTYbP9XrnwZ35GVcNoIfRBvx6bNZi5D8xotuNIPqYkCNus3MAaHoVObeit8G3couoRNwScyiXJAsOzL8-TX31xoyn6DNk3WoGErtk1PZ_s8P5wzBQaQOUElUXFE',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBEKfM41Z3TBl27jKwUQhCZ_RsVTWeC43mQB9ttXg7riCELVZnJuGESuK1nOVswT1QrFNxF_raQgy98d5u4tWxZfwZJ0OSf-gU3152h7n5IRGTa90IIaE8nIQUmWznDMSzcZ8szcXPve5bmPkSVubzPIBMRgj_UiNFZdpMPvDuSrW_hWSdMaWKIvZ7UQaSTkXjfOIQ8Gf2dIjVwI74QENxBILD7oDA97cT215ZtxYFMmHnA8w8iwnr9g0A6kXsNkDEVDf_cM37zdz4',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmMWUI1fa-WPF3Xfd4SzN97fd0ePph8KOLY9-O8-zzhe9cDhb3Br6xeWTyITXlJ4kJAnppLD5RIHnIRL67r0TYnyexQawrBgYgJHEWqEbbCcDeS47cwc9nuaG3fI8GcMLovCFL2_yDiLhmv8llrUtFXsVzFhMVwGj-OGRqEzXKVBNLBVqgLHenVL_WF8lGIIbiM1b6BlQcLeL0ltQj6gWtfTCKWBT4X2_PxWQFNlVsMZxNbv6rPsXrxHRfKiq2Wy095npe7wRQ9hY'
  ];

  const handleOpenMemberModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setMemberFormData({ name: member.name, role: member.role, avatar: member.avatar });
    } else {
      setEditingMember(null);
      setMemberFormData({ name: '', role: 'Contributor', avatar: avatars[0] });
    }
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = () => {
    if (!memberFormData.name.trim()) return;
    if (editingMember) {
      updateFamilyMember(editingMember.id, memberFormData);
    } else {
      addFamilyMember(memberFormData);
    }
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (id) => {
    if (window.confirm("Are you sure you want to remove this family member?")) {
      deleteFamilyMember(id);
    }
  };

  const mealPlanIngredients = useMemo(() => {
    if (!mealPlan) return [];
    const allIngredients = new Set();
    
    Object.values(mealPlan).forEach(day => {
      if (day && typeof day === 'object') {
        Object.values(day).forEach(meals => {
          if (Array.isArray(meals)) {
            meals.forEach(meal => {
              let rawIngs = [];
              if (Array.isArray(meal.ingredients)) {
                rawIngs = meal.ingredients;
              } else if (typeof meal.ingredients === 'string') {
                rawIngs = [meal.ingredients];
              }
              let ings = [];
              rawIngs.forEach(ing => {
                if (typeof ing === 'string') {
                  if (ing.includes('\n')) ings.push(...ing.split('\n'));
                  else if (ing.includes(',')) ings.push(...ing.split(','));
                  else ings.push(ing);
                } else {
                  ings.push(ing);
                }
              });
              ings = ings.map(i => typeof i === 'string' ? i.trim() : i).filter(Boolean);
              
              ings.forEach(ing => {
                if (ing && ing.length > 2) {
                  const match = ing.match(/^([\d\/\s\-\.]+(?:cups?|tsps?|tbsps?|g|kg|ml|l|oz|lbs?|pcs|units?|large|small|medium|cloves?|tins?|cans?|pinches?|pinch)?)\s+(.*)$/i);
                  const qty = match ? match[1].trim() : 'As needed';
                  const rawName = match ? match[2].trim() : ing;
                  const name = cleanIngredientName(rawName) || rawName;
                  const lowerName = name.toLowerCase();
                  const staples = ['salt', 'pepper', 'water', 'oil', 'olive oil', 'vegetable oil', 'sugar', 'ghee', 'butter', 'cardamom', 'garam masala', 'cumin', 'turmeric', 'egg', 'eggs', 'avocado', 'avacado', 'jaggery', 'honey'];
                  
                  const isStaple = staples.some(s => lowerName === s || lowerName.split(' ').includes(s));
                  
                  const inPantry = pantryItems && pantryItems.some(p => 
                    p.status !== 'Out of Stock' && 
                    (lowerName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lowerName))
                  );

                  if (!isStaple && !inPantry) {
                    allIngredients.add(JSON.stringify({ name, qty }));
                  }
                }
              });
            });
          }
        });
      }
    });

    return Array.from(allIngredients).map((json, i) => {
      const item = JSON.parse(json);
      const id = `ai-ing-${item.name}-${item.qty}`;
      return {
        id,
        name: item.name,
        quantity: item.qty,
        checked: checkedPlanItems.includes(id),
        isFromPlan: true
      };
    });
  }, [mealPlan, checkedPlanItems]);

  const cleanedGroceryList = useMemo(() => {
    return (groceryList || []).map(item => ({
      ...item,
      name: cleanIngredientName(item.name) || item.name
    }));
  }, [groceryList]);

  const combinedGroceryList = useMemo(() => {
    return [...cleanedGroceryList, ...mealPlanIngredients];
  }, [cleanedGroceryList, mealPlanIngredients]);
  
  const uncheckedItems = useMemo(() => combinedGroceryList.filter(item => !item.checked), [combinedGroceryList]);
  
  const hasCheckedItems = useMemo(() => cleanedGroceryList.some(item => item.checked), [cleanedGroceryList]);

  const clearInStockItems = () => {
    groceryList.filter(item => item.checked).forEach(item => {
      removeGroceryItem(item.id);
    });
  };

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

  const chefName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chef';

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const match = newItemName.trim().match(/^([\d\/\s\-\.]+(?:cups?|tsps?|tbsps?|g|kg|ml|l|oz|lbs?|pcs|units?|large|small|medium|cloves?|tins?|cans?|pinches?|pinch)?)\s+(.*)$/i);
    const qty = match ? match[1].trim() : '1 unit';
    const rawName = match ? match[2].trim() : newItemName.trim();
    const cleanName = cleanIngredientName(rawName) || rawName;
    addGroceryItem({ name: cleanName, quantity: qty });
    setNewItemName('');
    setIsAdding(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateFamilySubmit = async (e) => {
    e.preventDefault();
    if (!familyNameInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const fId = await createFamily(familyNameInput.trim());
      if (!fId) throw new Error("Failed to create family. Please check your connection.");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Do you have the database tables set up?");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!familyId) {
    return (
      <div className="bg-background min-h-screen pt-24 px-container-margin flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-lg py-12"
        >
          <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="material-symbols-outlined text-primary text-[48px]">family_restroom</span>
          </div>
          <h2 className="font-display-lg text-display-lg text-on-background">Welcome to Your Kitchen Hub</h2>
          <p className="text-on-surface-variant font-body-lg">Every great kitchen starts with a family. Create yours to begin sharing plans and lists.</p>
          
          <form onSubmit={handleCreateFamilySubmit} className="space-y-4 pt-6">
            <div className="relative">
              <input 
                type="text" 
                value={familyNameInput}
                onChange={(e) => setFamilyNameInput(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter Family Name (e.g. The Jenkins)"
                className="w-full px-6 py-4 bg-surface-container border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
              />
            </div>

            {errorMsg && (
              <p className="text-error text-sm font-label-md bg-error-container/20 p-3 rounded-lg border border-error/20">
                {errorMsg}
              </p>
            )}

            <button 
              type="submit"
              disabled={isSubmitting || !familyNameInput.trim()}
              className="w-full bg-primary text-on-primary py-4 rounded-2xl font-label-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Initializing...
                </>
              ) : (
                'Create Family Kitchen'
              )}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-on-surface-variant">Or</span></div>
          </div>

          <p className="text-on-surface-variant text-sm font-label-md">
            Were you invited? Check your email or WhatsApp for a join link.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-24 mt-16">
      <main className="pt-8 px-container-margin max-w-7xl mx-auto space-y-xl">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-7 space-y-sm">
            <h2 className="font-display-lg text-display-lg text-on-background">Kitchen Hub</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">Welcome to your family's culinary center. Your world is organized and ready for the next masterpiece.</p>
          </div>
          <div className="md:col-span-5 relative h-64 rounded-xl overflow-hidden shadow-lg">
            <img
              alt="Kitchen Interior"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6tJt1oEvZ7-5BMLlq-279AfKA-yTTX8Jc2QcFmPEE2wl-OAggPtw1aByU4onQPX85qIqUBvyaHX4BS9ux_oNOFGOXtNNhMQ0TZoQ70buuD9cs3CZ0DK3s2GXmhodfFnqC7grbSOT2I4HJqAE8fICS7ynONM1-70hUudOxvlxDV2KUSwgwTMK8WOmPnXSAzBdtVTGnalNOCI11aorvUOr2K-LSTnFdNaRI2uLbQlQ49TqC8oIftMlfKwwEnhkPkq86m2EK0Ilojjs"
            />
          </div>
        </section>

        {/* Today's Menu Section */}
        <section className="space-y-gutter">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md">Today's Culinary Schedule</h3>
            <p className="text-primary font-label-md bg-primary/10 px-4 py-1 rounded-full">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {['breakfast', 'lunch', 'dinner'].map(type => {
              const dayName = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
              const meals = mealPlan?.[dayName]?.[type] || [];
              return (
                <div key={type} className="space-y-sm">
                  <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pl-1">{type}</h4>
                  {meals.length > 0 ? meals.map((meal, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleRecipeClick(meal)}
                      className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4 border border-outline-variant hover:border-primary transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative">
                        <img src={meal.img} alt={meal.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="material-symbols-outlined text-white text-sm">visibility</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-label-lg text-label-lg text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{meal.title}</h5>
                        <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {meal.time}
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="bg-surface-container-highest/30 rounded-2xl p-4 border border-dashed border-outline-variant text-center">
                      <p className="text-label-sm text-on-surface-variant italic">No plan for {type}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="md:col-span-2 bg-surface-container rounded-xl p-md shadow-sm">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-md">Family Members</h3>
              <button onClick={() => handleOpenMemberModal()} className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-full active:scale-95 transition-transform hover:opacity-90 shadow-sm">
                Invite Member
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {(Array.isArray(familyMembers) ? familyMembers : []).map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 bg-surface rounded-lg shadow-sm border border-outline-variant/30 group relative">
                  <div className="relative">
                    <img
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                      src={member.avatar}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-label-md text-label-md">{member.name}</p>
                    <p className="text-secondary font-label-sm text-label-sm">{member.role}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenMemberModal(member)} className="p-2 hover:bg-surface-container rounded-full text-primary">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => handleDeleteMember(member.id)} className="p-2 hover:bg-error-container/20 rounded-full text-error">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={() => handleOpenMemberModal()} className="border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-variant/20 transition-colors h-[82px] w-full">
                <span className="material-symbols-outlined">add</span>
                <span className="font-label-md text-label-md">Add Family Member</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-md shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-md">
              <span className="material-symbols-outlined text-tertiary">warning</span>
              <h3 className="font-headline-md text-headline-md">Shared Health</h3>
            </div>
            <div className="flex-grow space-y-sm">
              {(Array.isArray(dietaryRestrictions) ? dietaryRestrictions : []).map((res) => (
                <div key={res?.id} className={`p-3 ${res?.color || 'bg-surface'} rounded-lg flex justify-between items-center group`}>
                  <div>
                    <p className={`font-label-md text-label-md ${res?.color?.includes('tertiary') ? 'text-on-tertiary-fixed' : ''}`}>{res?.name}</p>
                    <p className={`text-[10px] uppercase tracking-wider ${res?.color?.includes('tertiary') ? 'text-on-tertiary-fixed-variant' : 'text-on-surface-variant'}`}>{res?.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${res.icon === 'check_circle' ? 'text-secondary' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{res.icon}</span>
                    <button onClick={() => removeRestriction(res.id)} className="opacity-0 group-hover:opacity-100 text-error p-1 hover:bg-error-container/20 rounded">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setIsDietaryModalOpen(true)} className="mt-md w-full border border-primary text-primary font-label-md text-label-md py-2 rounded-full hover:bg-primary/5 transition-all">
              Manage Restrictions
            </button>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-2xl p-md md:p-lg border border-surface-variant shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-[120px]">shopping_basket</span>
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
              <div className="space-y-xs max-w-2xl">
                <h3 className="font-headline-lg text-headline-lg">Must-Buy Grocery List</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Essential items needed for the upcoming week's meal plan.</p>
                <div className="bg-gradient-to-r from-primary-container to-tertiary-container text-on-surface px-4 py-2.5 rounded-xl inline-flex items-center gap-3 mt-3 border border-outline-variant shadow-md">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                  <span className="font-label-lg text-label-lg font-bold">Tip: Press the cart icon to instantly order items on BigBasket, Blinkit, Zepto, or Instamart.</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {hasCheckedItems && (
                  <button 
                    onClick={clearInStockItems} 
                    className="border border-error/40 hover:border-error text-error px-4 py-2 rounded-full font-label-md text-label-md active:scale-95 transition-transform flex items-center gap-1 hover:bg-error/5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">clear_all</span>
                    Clear In-Stock
                  </button>
                )}
                <button className="bg-surface p-2 rounded-lg shadow-sm active:scale-95 transition-transform hover:bg-surface-variant/50">
                  <span className="material-symbols-outlined">sync</span>
                </button>
                {isAdding ? (
                  <form onSubmit={handleAddItem} className="flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Item name..."
                      className="bg-surface border border-primary rounded-full px-4 py-2 text-label-md focus:outline-none"
                    />
                    <button type="submit" className="bg-primary text-on-primary px-4 py-2 rounded-full font-label-md active:scale-95">Add</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-outline-variant font-label-md">Cancel</button>
                  </form>
                ) : (
                  <button onClick={() => setIsAdding(true)} className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md active:scale-95 transition-transform flex items-center gap-2 shadow-md hover:opacity-90">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add Item
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {(Array.isArray(combinedGroceryList) ? combinedGroceryList : []).map((item) => (
                <div 
                  key={item?.id || Math.random()} 
                  onClick={() => !item?.isFromPlan && item?.id && toggleGroceryItem(item.id)} 
                  className={`bg-surface p-4 rounded-xl flex items-center justify-between shadow-sm border transition-all duration-200 ${
                    item?.isFromPlan 
                      ? 'border-secondary/30 bg-secondary/5' 
                      : item?.checked 
                        ? 'border-outline-variant/10 bg-surface-container-lowest opacity-60' 
                        : 'border-outline-variant/20'
                  } group hover:border-primary cursor-pointer`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <input 
                      type="checkbox" 
                      checked={item.checked || false} 
                      onChange={(e) => {
                        e.stopPropagation();
                        if (item.isFromPlan) {
                          toggleCheckedPlanItem(item.id);
                        } else {
                          toggleGroceryItem(item.id);
                        }
                      }}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer disabled:opacity-40 flex-shrink-0" 
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.isFromPlan ? 'bg-secondary-container' : 'bg-surface-container group-hover:bg-primary-container'
                    }`}>
                      <span className={`material-symbols-outlined text-[20px] ${item.isFromPlan ? 'text-secondary' : 'text-primary'}`}>
                        {item.isFromPlan ? 'restaurant_menu' : 'eco'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-label-md text-label-md break-words pr-2 ${
                        item.isFromPlan ? 'text-secondary font-bold' : 'text-on-surface'
                      } ${item.checked ? 'line-through text-on-surface-variant/50 font-normal' : ''}`}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-on-surface-variant text-label-sm font-label-sm truncate">
                          {item.quantity}
                        </span>
                        {item.isFromPlan && (
                          <span className="bg-secondary/15 text-secondary text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                            Planned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setActiveOrderItem(item);
                        setIsDeliveryModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-secondary/20 rounded-lg text-secondary active:scale-95 transition-transform"
                      title={`Order ${item.name}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                    </button>
                    {!item.isFromPlan && (
                      <button 
                        onClick={() => removeGroceryItem(item.id)}
                        className="p-1.5 hover:bg-error-container/20 rounded-lg text-error active:scale-95 transition-transform"
                        title="Delete Item"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                    {item.isFromPlan && (
                      <span className="material-symbols-outlined text-secondary/40 text-[18px]">auto_awesome</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Groceries section */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant/30 pt-6 gap-4">
              <p className="text-on-surface-variant text-sm font-label-md">
                {uncheckedItems.length} item{uncheckedItems.length !== 1 ? 's' : ''} remaining to buy.
              </p>
              <button 
                onClick={() => setIsDeliveryModalOpen(true)}
                disabled={uncheckedItems.length === 0}
                className="w-full sm:w-auto bg-secondary text-on-secondary px-8 py-3.5 rounded-full font-label-md text-label-md active:scale-95 transition-all shadow-md hover:opacity-90 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                Order Groceries
              </button>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemberModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-high p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="font-headline-lg text-headline-lg mb-6">
                {editingMember ? 'Edit' : 'Add'} Family Member
              </h3>
              <div className="space-y-6">
                <div className="flex justify-center gap-4">
                  {avatars.map((url, i) => (
                    <button 
                      key={i} 
                      onClick={() => setMemberFormData({...memberFormData, avatar: url})}
                      className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${memberFormData.avatar === url ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                      {memberFormData.avatar === url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-xl">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-label-md font-label-md">Full Name</label>
                  <input 
                    type="text" 
                    value={memberFormData.name}
                    onChange={(e) => setMemberFormData({...memberFormData, name: e.target.value})}
                    placeholder="e.g. Leo Jenkins"
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-md font-label-md">Role</label>
                  <select 
                    value={memberFormData.role}
                    onChange={(e) => setMemberFormData({...memberFormData, role: e.target.value})}
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option>Chef</option>
                    <option>Contributor</option>
                    <option>Viewer</option>
                    <option>Child</option>
                  </select>
                </div>

                <div className="border-t border-outline-variant pt-6 space-y-4">
                  <p className="text-label-md font-label-md text-on-surface-variant">Or Share Invite Link</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleShareInvite('whatsapp')}
                      disabled={isGeneratingLink}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                      WhatsApp
                    </button>
                    <button 
                      onClick={() => handleShareInvite('telegram')}
                      disabled={isGeneratingLink}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0088cc]/10 text-[#0088cc] rounded-xl hover:bg-[#0088cc]/20 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      Telegram
                    </button>
                    <button 
                      onClick={() => handleShareInvite('copy')}
                      disabled={isGeneratingLink}
                      className="p-3 bg-surface border border-outline rounded-xl hover:bg-surface-variant transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsMemberModalOpen(false)}
                    className="flex-grow px-6 py-3 border border-outline text-on-surface font-label-md rounded-xl hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveMember}
                    className="flex-grow px-6 py-3 bg-primary text-on-primary font-label-md rounded-xl hover:shadow-lg transition-all"
                  >
                    Save Member
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                        <p className="text-on-surface-variant italic">Full instructions are being optimized for your kitchen.</p>
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

      <AnimatePresence>
        {isDietaryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDietaryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-high p-8 rounded-3xl shadow-2xl"
            >
              <h3 className="font-headline-lg text-headline-lg mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">health_metrics</span>
                Dietary Preferences
              </h3>
              
              <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {dietaryRestrictions.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/30">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${res.icon === 'check_circle' ? 'text-secondary' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{res.icon}</span>
                      <span className="font-label-lg">{res.name}</span>
                    </div>
                    <button 
                      onClick={() => removeRestriction(res.id)}
                      className="text-error hover:bg-error-container/20 p-2 rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <p className="font-label-md text-on-surface-variant">Add New Restriction</p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newRestrictionInput}
                    onChange={(e) => setNewRestrictionInput(e.target.value)}
                    placeholder="e.g. Dairy-Free"
                    className="flex-1 px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (newRestrictionInput.trim()) {
                        useAppStore.getState().addRestriction({ 
                          name: newRestrictionInput.trim(), 
                          type: 'User Defined', 
                          color: 'bg-surface', 
                          icon: 'check_circle' 
                        });
                        setNewRestrictionInput('');
                      }
                    }}
                    className="bg-primary text-on-primary p-3 rounded-xl hover:shadow-lg active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button 
                  onClick={() => setIsDietaryModalOpen(false)}
                  className="w-full py-4 bg-primary text-on-primary font-label-lg rounded-2xl hover:shadow-lg transition-all"
                >
                  Close & Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeliveryModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
                        <span>{item.name} <span className="text-on-surface-variant text-xs">({item.quantity})</span></span>
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

export default FamilyKitchenHub;
