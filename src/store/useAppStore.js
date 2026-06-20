import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useAuthStore from './useAuthStore';
import { supabase } from '../services/supabaseClient';
import { 
  syncProfileToDb, 
  syncGroceryListToDb, 
  fetchProfileFromDb, 
  fetchGroceryListFromDb, 
  syncMealPlanToDb, 
  fetchMealPlanFromDb, 
  syncFamilyMembersToDb, 
  fetchFamilyMembersFromDb, 
  fetchFamilyId, 
  createFamily, 
  sendFamilyInvite, 
  generateInviteLink,
  syncPantryToDb,
  fetchPantryFromDb,
  deletePantryItemFromDb
} from '../services/dbService';
import { connectHealthPlatform, fetchHealthData } from '../services/healthService';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getWeekCommencingDate = () => {
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

const useAppStore = create(
  persist(
    (set, get) => ({
      // Theme State
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      
      // Language State
      language: 'English',
      setLanguage: (language) => set({ language }),

      // User Profile & Preferences
      // Family ID Context
      familyId: null,
      setFamilyId: (familyId) => set({ familyId }),

      userProfile: {
        name: '',
        role: 'Chef',
        masteryLevel: 'Apprentice Global Chef',
        regionsExplored: 0,
        dietaryRestrictions: [],
        cuisines: [],
        onboarded: false
      },
      updateUserProfile: (updates) => set((state) => {
        const newProfile = { ...state.userProfile, ...updates };
        syncProfileToDb(newProfile, state.activePlan, state.dietaryRestrictions);
        return { userProfile: newProfile };
      }),

      // Pantry Management
      pantryItems: [
        { id: 'p1', name: 'Smoked Paprika', quantity: '15g left', status: 'Low', category: 'Spices', level: 25, color: 'bg-error' },
        { id: 'p2', name: 'Cumin Seeds', quantity: '45g left', status: 'Optimal', category: 'Spices', level: 75, color: 'bg-secondary' },
        { id: 'p3', name: 'Turmeric', quantity: '80g left', status: 'Stocked', category: 'Spices', level: 100, color: 'bg-secondary' },
        { id: 'p4', name: 'Basmati Rice', quantity: '2.4kg left', status: 'Stocked', category: 'Grains', level: 90, color: 'bg-secondary', checked: true },
        { id: 'p5', name: 'Quinoa', quantity: '400g left', status: 'Stocked', category: 'Grains', level: 80, color: 'bg-secondary', checked: true },
        { id: 'p6', name: 'Arborio Rice', quantity: 'Out of Stock', status: 'Out of Stock', category: 'Grains', level: 0, color: 'bg-error', checked: false },
        { id: 'p7', name: 'Carrots', quantity: 'Expires: 2d', status: 'Fresh', category: 'Fresh', level: 60, color: 'bg-amber-400', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ6O8p5Z1FmE5XyWjG2D7m-kL6Xz7h0x1Z4r4bV9wD8x7y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7' },
        { id: 'p8', name: 'Fresh Basil', quantity: 'Grown Locally', status: 'Fresh', category: 'Fresh', level: 100, color: 'bg-secondary', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-1Lcb4RqSqFXPv-eKiLr_Gy8aCxdZyr-BVO7jpBjpm1VeTYlMrKxDToIEuFaQNlvzsp7QV9kjODrFCjArz_vUt5zWSvkBaFpbWpneksQqbGng7-C-l6xPUHyDKJh9Ihp4tx4SHQkkfRyJLmz_olTKU-C4mFo-Vo1xo56ziRYLdUb48ivZoSUOlsoh0gYh9L4X5TMfZ8P8ztLW0tZBmFQTYp01DLEVo-JE7hWtCC4RbvSbuPQf4b72s2jpWUa69A48hy9XKty28Fs8' },
      ],
      addPantryItem: async (item) => {
        const newItem = { ...item, id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
        set((state) => ({ pantryItems: [...state.pantryItems, newItem] }));
        
        const user = useAuthStore.getState().user;
        if (user) {
          const { error } = await supabase.from('pantry_items').insert({
            id: newItem.id,
            user_id: user.id,
            name: newItem.name,
            category: newItem.category,
            quantity: newItem.quantity,
            status: newItem.status,
            level: newItem.level,
            color: newItem.color || null,
            img: newItem.img || null,
            checked: newItem.checked || false,
          });
          if (error) console.error("Error adding pantry item:", error);
        }
      },
      updatePantryItem: async (id, updates) => {
        set((state) => ({
          pantryItems: state.pantryItems.map(item => item.id === id ? { ...item, ...updates } : item)
        }));
        
        const user = useAuthStore.getState().user;
        if (user) {
          const validUpdates = {};
          if (updates.name !== undefined) validUpdates.name = updates.name;
          if (updates.category !== undefined) validUpdates.category = updates.category;
          if (updates.quantity !== undefined) validUpdates.quantity = updates.quantity;
          if (updates.status !== undefined) validUpdates.status = updates.status;
          if (updates.level !== undefined) validUpdates.level = updates.level;
          if (updates.color !== undefined) validUpdates.color = updates.color;
          if (updates.img !== undefined) validUpdates.img = updates.img;
          if (updates.checked !== undefined) validUpdates.checked = updates.checked;

          const { error } = await supabase.from('pantry_items').update(validUpdates).eq('id', id).eq('user_id', user.id);
          if (error) console.error("Error updating pantry item:", error);
        }
      },
      deletePantryItem: async (id) => {
        set((state) => ({ pantryItems: state.pantryItems.filter(item => item.id !== id) }));
        
        const user = useAuthStore.getState().user;
        if (user) {
          const { error } = await supabase.from('pantry_items').delete().eq('id', id).eq('user_id', user.id);
          if (error) console.error("Error deleting pantry item:", error);
        }
      },

      // Kitchen Management (Grocery List, etc.)
      groceryList: [],
      addGroceryItem: async (item) => {
        const state = get();
        const existing = state.groceryList.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
          return; // Avoid duplicate
        }

        const newItem = { ...item, id: Date.now().toString(), checked: false };
        set((state) => ({ groceryList: [...state.groceryList, newItem] }));
        
        const user = useAuthStore.getState().user;
        if (user) {
          const { error } = await supabase.from('grocery_items').insert({
            id: newItem.id,
            user_id: user.id,
            name: newItem.name,
            category: newItem.category,
            quantity: newItem.quantity,
            checked: newItem.checked || false,
          });
          if (error) console.error("Error adding grocery item:", error);
        }
      },
      toggleGroceryItem: async (id) => {
        let isChecked = false;
        set((state) => {
          const newList = state.groceryList.map(item => {
            if (item.id === id) {
              isChecked = !item.checked;
              return { ...item, checked: isChecked };
            }
            return item;
          });
          return { groceryList: newList };
        });
        
        const user = useAuthStore.getState().user;
        if (user) {
          const { error } = await supabase.from('grocery_items').update({ checked: isChecked }).eq('id', id).eq('user_id', user.id);
          if (error) console.error("Error toggling grocery item:", error);
        }
      },
      removeGroceryItem: async (id) => {
        set((state) => ({
          groceryList: state.groceryList.filter(item => item.id !== id)
        }));
        
        const user = useAuthStore.getState().user;
        if (user) {
          const { error } = await supabase.from('grocery_items').delete().eq('id', id).eq('user_id', user.id);
          if (error) console.error("Error deleting grocery item:", error);
        }
      },

      checkedPlanItems: [],
      toggleCheckedPlanItem: (id) => set((state) => {
        const set = new Set(state.checkedPlanItems);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return { checkedPlanItems: Array.from(set) };
      }),

      // Saved/Favorited Recipes
      savedRecipes: [],
      toggleSaveRecipe: (recipe) => set((state) => {
        const exists = state.savedRecipes.some(r => r.title === recipe.title);
        const newList = exists 
          ? state.savedRecipes.filter(r => r.title !== recipe.title) 
          : [...state.savedRecipes, recipe];
        return { savedRecipes: newList };
      }),

      fetchInitialData: async () => {
        try {
          const fId = await fetchFamilyId();
          if (fId) {
            set({ familyId: fId });
            const [profile, groceryList, pantry, mealPlan, familyMembers] = await Promise.all([
              fetchProfileFromDb(),
              fetchGroceryListFromDb(),
              fetchPantryFromDb(),
              fetchMealPlanFromDb(fId),
              fetchFamilyMembersFromDb(fId)
            ]);
            
            if (profile) {
              // Merge userProfile shallowly so we don't wipe out other properties unexpectedly
              set((state) => ({ userProfile: { ...state.userProfile, ...profile } }));
              if (profile.activePlan) set({ activePlan: profile.activePlan });
              if (Array.isArray(profile.dietaryRestrictions)) {
                const parsedRestrictions = profile.dietaryRestrictions.map(r => {
                  if (typeof r === 'string') {
                    try {
                      const parsed = JSON.parse(r);
                      if (parsed && typeof parsed === 'object' && parsed.name) return parsed;
                    } catch(e) {}
                    return { id: generateUUID(), name: r, type: 'Preference', color: 'bg-surface-variant', icon: 'check_circle' };
                  }
                  return r;
                });
                set({ dietaryRestrictions: parsedRestrictions });
              }
            }
            
            if (groceryList && groceryList.length > 0) set({ groceryList });
            else if (get().groceryList.length > 0) syncGroceryListToDb(get().groceryList);

            if (pantry && pantry.length > 0) set({ pantryItems: pantry });
            else if (get().pantryItems.length > 0) syncPantryToDb(get().pantryItems);
            
            if (mealPlan && Object.keys(mealPlan).length > 0) {
              const currentWeek = getWeekCommencingDate();
              if (mealPlan.weekCommencing !== currentWeek) {
                get().resetMealPlan(); // Handles syncing
              } else {
                set({ mealPlan });
              }
            } else {
              syncMealPlanToDb(get().mealPlan, fId);
            }

            if (familyMembers && familyMembers.length > 0) set({ familyMembers });
            else if (get().familyMembers.length > 0) syncFamilyMembersToDb(get().familyMembers, fId);
            
          } else {
            // No family yet, user needs to create one or join
            const [profile, pantry, groceryList] = await Promise.all([
              fetchProfileFromDb(),
              fetchPantryFromDb(),
              fetchGroceryListFromDb()
            ]);
            
            if (profile) {
              set((state) => ({ userProfile: { ...state.userProfile, ...profile } }));
              if (profile.activePlan) set({ activePlan: profile.activePlan });
              if (Array.isArray(profile.dietaryRestrictions)) {
                const parsedRestrictions = profile.dietaryRestrictions.map(r => {
                  if (typeof r === 'string') {
                    try {
                      const parsed = JSON.parse(r);
                      if (parsed && typeof parsed === 'object' && parsed.name) return parsed;
                    } catch(e) {}
                    return { id: generateUUID(), name: r, type: 'Preference', color: 'bg-surface-variant', icon: 'check_circle' };
                  }
                  return r;
                });
                set({ dietaryRestrictions: parsedRestrictions });
              }
            }
            
            if (pantry && pantry.length > 0) set({ pantryItems: pantry });
            else if (get().pantryItems.length > 0) syncPantryToDb(get().pantryItems);

            if (groceryList && groceryList.length > 0) set({ groceryList });
            else if (get().groceryList.length > 0) syncGroceryListToDb(get().groceryList);

            // Check and reset local meal plan if week changed
            const localPlan = get().mealPlan;
            const currentWeek = getWeekCommencingDate();
            if (localPlan && localPlan.weekCommencing !== currentWeek) {
              get().resetMealPlan();
            }
          }
        } catch (error) {
          console.error("Error fetching initial data:", error);
        }
      },

      // Family Hub State
      familyMembers: [],
      addFamilyMember: async (member) => {
        let fId = get().familyId;
        if (!fId) {
          try { fId = await get().createFamily('My Family'); } catch(e) {}
        }
        const newMembers = [...get().familyMembers, { ...member, id: generateUUID() }];
        set({ familyMembers: newMembers });
        syncFamilyMembersToDb(newMembers, fId);
      },
      updateFamilyMember: async (id, updates) => {
        let fId = get().familyId;
        if (!fId) {
          try { fId = await get().createFamily('My Family'); } catch(e) {}
        }
        const newMembers = get().familyMembers.map(m => m.id === id ? { ...m, ...updates } : m);
        set({ familyMembers: newMembers });
        syncFamilyMembersToDb(newMembers, fId);
      },
      deleteFamilyMember: async (id) => {
        let fId = get().familyId;
        const newMembers = get().familyMembers.filter(m => m.id !== id);
        set({ familyMembers: newMembers });
        syncFamilyMembersToDb(newMembers, fId);
      },

      // New Family Management Actions
      createFamily: async (name) => {
        const fId = await createFamily(name);
        set({ familyId: fId });
        const { familyMembers } = get();
        await syncFamilyMembersToDb(familyMembers, fId);
        return fId;
      },
      sendInvite: async (email) => {
        const { familyId } = get();
        if (familyId) await sendFamilyInvite(familyId, email);
      },
      generateInviteLinkAction: async () => {
        const { familyId } = get();
        if (familyId) return await generateInviteLink(familyId);
        return null;
      },

      activePlan: 'Taste', // 'Taste', 'Savor', or 'Feast'
      setActivePlan: async (activePlan, expiresAt = null) => {
        set({ activePlan });
        if (expiresAt) {
          set(state => ({ userProfile: { ...state.userProfile, plan_expires_at: expiresAt } }));
        }
        const { userProfile, dietaryRestrictions } = get();
        await syncProfileToDb(userProfile, activePlan, dietaryRestrictions);
      },

      dailyRecipeCount: 0,
      lastRecipeResetDate: '',
      checkAndIncrementRecipeLimit: () => {
        const state = get();
        const currentDate = new Date().toDateString();
        let currentCount = state.dailyRecipeCount;
        let lastDate = state.lastRecipeResetDate;

        if (lastDate !== currentDate) {
          currentCount = 0;
          lastDate = currentDate;
        }

        if (state.activePlan === 'Taste' && currentCount >= 3) {
          return false;
        }

        set({
          dailyRecipeCount: currentCount + 1,
          lastRecipeResetDate: lastDate
        });
        return true;
      },

      dietaryRestrictions: [
        { id: 'd1', name: 'Peanut Allergy', type: 'Critical Severity', color: 'bg-tertiary-fixed', icon: 'block' },
        { id: 'd2', name: 'Gluten-Free', type: 'Preference', color: 'bg-secondary-container', icon: 'check_circle' },
        { id: 'd3', name: 'Low Sodium', type: 'Ongoing', color: 'bg-surface', icon: 'check_circle' }
      ],
      addRestriction: (res) => {
        const state = get();
        if (state.activePlan === 'Taste' && state.dietaryRestrictions.length >= 1) {
          return;
        }
        const newRestrictions = [...state.dietaryRestrictions, { ...res, id: generateUUID() }];
        set({ dietaryRestrictions: newRestrictions });
        const { userProfile, activePlan } = get();
        syncProfileToDb(userProfile, activePlan, newRestrictions);
      },
      removeRestriction: (id) => {
        const state = get();
        const newRestrictions = state.dietaryRestrictions.filter(r => r.id !== id);
        set({ dietaryRestrictions: newRestrictions });
        const { userProfile, activePlan } = get();
        syncProfileToDb(userProfile, activePlan, newRestrictions);
      },

      // Health Goals & Modal
      healthGoals: { calories: '', fitnessGoal: 'General Health', glucoseTarget: '' },
      setHealthGoals: (goals) => set({ healthGoals: goals }),
      isHealthModalOpen: false,
      setHealthModalOpen: (isOpen) => set({ isHealthModalOpen: isOpen }),
      
      // Native Health Integrations
      healthIntegrations: { appleHealth: false, googleFit: false, glucoseMonitor: false },
      syncedHealthData: { steps: 0, activeCalories: 0, currentGlucose: 0 },
      toggleHealthIntegration: async (integrationName, isEnabled) => {
        if (isEnabled) {
          try {
            // Attempt to request native OS permissions
            await connectHealthPlatform();
            // Fetch real health data
            const data = await fetchHealthData();
            
            set(state => ({
              healthIntegrations: { ...state.healthIntegrations, [integrationName]: true },
              syncedHealthData: {
                steps: data.steps || state.syncedHealthData.steps,
                activeCalories: data.calories || state.syncedHealthData.activeCalories,
                currentGlucose: data.glucose || state.syncedHealthData.currentGlucose,
              }
            }));

            // Automatically update health goals based on synced data (for demo/convenience)
            if (data.calories && integrationName !== 'glucoseMonitor') {
               set(state => ({
                 healthGoals: { ...state.healthGoals, calories: String(Math.max(1200, 2500 - data.calories)) }
               }));
            }
            if (data.glucose && integrationName === 'glucoseMonitor') {
               set(state => ({
                 healthGoals: { ...state.healthGoals, glucoseTarget: String(data.glucose) }
               }));
            }
          } catch (err) {
            console.error('Failed to enable health integration:', err);
            // Revert toggle if failed
            set(state => ({ healthIntegrations: { ...state.healthIntegrations, [integrationName]: false } }));
            throw err;
          }
        } else {
          // Disable integration
          set(state => ({
            healthIntegrations: { ...state.healthIntegrations, [integrationName]: false }
          }));
        }
      },

      // AI Context & Recommendations
      searchHistory: [],
      addSearchToHistory: (query) => set((state) => {
        const newHistory = [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 10);
        return { searchHistory: newHistory };
      }),
      currentRecipeParams: {
        ingredients: [],
        cuisine: '',
        diet: []
      },
      setRecipeParams: (params) => set({ currentRecipeParams: params }),

      // Meal Plan State
      mealPlan: {
        weekCommencing: getWeekCommencingDate(),
        MON: { breakfast: [], lunch: [], dinner: [] },
        TUE: { breakfast: [], lunch: [], dinner: [] },
        WED: { breakfast: [], lunch: [], dinner: [] },
        THU: { breakfast: [], lunch: [], dinner: [] },
        FRI: { breakfast: [], lunch: [], dinner: [] },
        SAT: { breakfast: [], lunch: [], dinner: [] },
        SUN: { breakfast: [], lunch: [], dinner: [] },
      },
      setMealPlan: (mealPlan) => {
        const { familyId } = get();
        const currentWeek = getWeekCommencingDate();
        const planWithWeek = {
          weekCommencing: mealPlan.weekCommencing || currentWeek,
          ...mealPlan
        };
        set({ mealPlan: planWithWeek });
        if (familyId) syncMealPlanToDb(planWithWeek, familyId);
      },
      resetMealPlan: () => {
        const currentWeek = getWeekCommencingDate();
        const emptyPlan = {
          weekCommencing: currentWeek,
          MON: { breakfast: [], lunch: [], dinner: [] },
          TUE: { breakfast: [], lunch: [], dinner: [] },
          WED: { breakfast: [], lunch: [], dinner: [] },
          THU: { breakfast: [], lunch: [], dinner: [] },
          FRI: { breakfast: [], lunch: [], dinner: [] },
          SAT: { breakfast: [], lunch: [], dinner: [] },
          SUN: { breakfast: [], lunch: [], dinner: [] },
        };
        set({ mealPlan: emptyPlan });
        const { familyId } = get();
        if (familyId) syncMealPlanToDb(emptyPlan, familyId);
      },
      updateMealPlan: (day, type, meals) => set((state) => {
        const currentWeek = getWeekCommencingDate();
        const newPlan = {
          ...state.mealPlan,
          weekCommencing: state.mealPlan.weekCommencing || currentWeek,
          [day]: {
            ...state.mealPlan[day],
            [type]: meals
          }
        };
        if (state.familyId) syncMealPlanToDb(newPlan, state.familyId);
        return { mealPlan: newPlan };
      }),
      resetStore: () => set({
        theme: 'light',
        language: 'English',
        familyId: null,
        userProfile: {
          name: '',
          role: 'Chef',
          masteryLevel: 'Apprentice Global Chef',
          regionsExplored: 0,
          dietaryRestrictions: [],
          cuisines: [],
          onboarded: false
        },
        pantryItems: [
          { id: 'p1', name: 'Smoked Paprika', quantity: '15g left', status: 'Low', category: 'Spices', level: 25, color: 'bg-error' },
          { id: 'p2', name: 'Cumin Seeds', quantity: '45g left', status: 'Optimal', category: 'Spices', level: 75, color: 'bg-secondary' },
          { id: 'p3', name: 'Turmeric', quantity: '80g left', status: 'Stocked', category: 'Spices', level: 100, color: 'bg-secondary' },
          { id: 'p4', name: 'Basmati Rice', quantity: '2.4kg left', status: 'Stocked', category: 'Grains', level: 90, color: 'bg-secondary', checked: true },
          { id: 'p5', name: 'Quinoa', quantity: '400g left', status: 'Stocked', category: 'Grains', level: 80, color: 'bg-secondary', checked: true },
          { id: 'p6', name: 'Arborio Rice', quantity: 'Out of Stock', status: 'Out of Stock', category: 'Grains', level: 0, color: 'bg-error', checked: false },
          { id: 'p7', name: 'Carrots', quantity: 'Expires: 2d', status: 'Fresh', category: 'Fresh', level: 60, color: 'bg-amber-400', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ6O8p5Z1FmE5XyWjG2D7m-kL6Xz7h0x1Z4r4bV9wD8x7y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7' },
          { id: 'p8', name: 'Fresh Basil', quantity: 'Grown Locally', status: 'Fresh', category: 'Fresh', level: 100, color: 'bg-secondary', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-1Lcb4RqSqFXPv-eKiLr_Gy8aCxdZyr-BVO7jpBjpm1VeTYlMrKxDToIEuFaQNlvzsp7QV9kjODrFCjArz_vUt5zWSvkBaFpbWpneksQqbGng7-C-l6xPUHyDKJh9Ihp4tx4SHQkkfRyJLmz_olTKU-C4mFo-Vo1xo56ziRYLdUb48ivZoSUOlsoh0gYh9L4X5TMfZ8P8ztLW0tZBmFQTYp01DLEVo-JE7hWtCC4RbvSbuPQf4b72s2jpWUa69A48hy9XKty28Fs8' }
        ],
        groceryList: [],
        checkedPlanItems: [],
        savedRecipes: [],
        familyMembers: [],
        activePlan: 'Taste',
        dailyRecipeCount: 0,
        lastRecipeResetDate: '',
        healthGoals: { calories: '', fitnessGoal: 'General Health', glucoseTarget: '' },
        healthIntegrations: { appleHealth: false, googleFit: false, glucoseMonitor: false },
        syncedHealthData: { steps: 0, activeCalories: 0, currentGlucose: 0 },
        isHealthModalOpen: false,
        mealPlan: {
          weekCommencing: getWeekCommencingDate(),
          MON: { breakfast: [], lunch: [], dinner: [] },
          TUE: { breakfast: [], lunch: [], dinner: [] },
          WED: { breakfast: [], lunch: [], dinner: [] },
          THU: { breakfast: [], lunch: [], dinner: [] },
          FRI: { breakfast: [], lunch: [], dinner: [] },
          SAT: { breakfast: [], lunch: [], dinner: [] },
          SUN: { breakfast: [], lunch: [], dinner: [] },
        }
      }),
    }),
    {
      name: 'epicurean-ai-storage',
      version: 5, // Bumped: strictly clear grocery list again to ensure it defaults to empty
      migrate: (persistedState, fromVersion) => {
        const state = persistedState || {};

        // Clear hardcoded preset family members (IDs f1, f2, f3)
        const PRESET_MEMBER_IDS = ['f1', 'f2', 'f3'];
        const members = state.familyMembers || [];
        state.familyMembers = members.filter(m => !PRESET_MEMBER_IDS.includes(m.id));

        if (fromVersion < 5) {
          // Force clear grocery list — must be empty by default (or re-fetched from Supabase)
          state.groceryList = [];
        }

        if (fromVersion < 4) {
          // Clear preset pantry items (ids p1-p8 from demo data)
          const PRESET_PANTRY_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
          const pantry = state.pantryItems || [];
          state.pantryItems = pantry.filter(p => !PRESET_PANTRY_IDS.includes(p.id));

          // Reset demo profile name so it gets replaced by real DB profile on login
          if (state.userProfile?.name === 'Chef Sarah') {
            state.userProfile = { ...state.userProfile, name: '' };
          }
        }

        return state;
      },
    }
  )
);

export default useAppStore;
