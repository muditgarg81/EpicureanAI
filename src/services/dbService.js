import { supabase } from './supabaseClient';
import useAuthStore from '../store/useAuthStore';
import { Capacitor } from '@capacitor/core';

export const syncProfileToDb = async (profile, activePlan = null, dietaryRestrictions = null) => {
  const user = useAuthStore.getState().user;
  if (!user) return;
  
  const payload = { 
    id: user.id, 
    ...profile 
  };
  
  // Use "activePlan" exactly as the column name
  if (activePlan) payload["activePlan"] = activePlan;
  if (dietaryRestrictions) payload.dietaryRestrictions = dietaryRestrictions;
  
  // Save local backup first
  localStorage.setItem(`epicurean-profile-${user.id}`, JSON.stringify(payload));
  
  const { error } = await supabase
    .from('profiles')
    .upsert(payload);
    
  if (error) {
    console.error("Error syncing profile to DB, trying fallback:", error);
    // If activePlan column is missing in schema, try syncing without it
    if (error.message && (error.message.includes('activePlan') || error.code === 'PGRST204')) {
      const { activePlan: _, ...profileWithoutActivePlan } = payload;
      const { error: fallbackError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profileWithoutActivePlan });
      if (fallbackError) {
        console.error("Fallback profile sync failed:", fallbackError);
      } else {
        console.log("Successfully synced profile without activePlan column");
      }
    }
  }
};

export const fetchProfileFromDb = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return null;

  let dbProfile = null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!error) {
    dbProfile = data;
  } else if (error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error("Error fetching profile:", error);
  }

  // Retrieve local backup
  let localProfile = null;
  const stored = localStorage.getItem(`epicurean-profile-${user.id}`);
  if (stored) {
    try {
      localProfile = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored profile:", e);
    }
  }

  const merged = { ...localProfile, ...dbProfile };
  if (!merged.activePlan) merged.activePlan = 'Taste';
  return Object.keys(merged).length > 0 ? merged : null;
};

export const syncGroceryListToDb = async (list) => {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const items = list.map(item => ({ ...item, user_id: user.id }));
  
  const { error } = await supabase
    .from('grocery_items')
    .upsert(items, { onConflict: 'id' });
    
  if (error) console.error("Error syncing grocery list:", error);
};

export const fetchGroceryListFromDb = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error("Error fetching grocery list:", error);
    return [];
  }
  
  // Filter out legacy mock data that was accidentally synced to users' databases
  const legacyMockItems = ["spinach", "farm eggs", "milk", "apple", "tuna", "chicken"];
  const filteredData = data.filter(item => {
    const name = item.name.toLowerCase();
    return !legacyMockItems.some(mock => name.includes(mock));
  });
  
  return filteredData;
};

export const fetchFamilyId = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data?.family_id;
};

export const createFamily = async (name) => {
  const user = useAuthStore.getState().user;
  if (!user) return null;

  // 1. Create family
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (familyError) throw familyError;

  // 2. Update user profile with family_id
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, family_id: family.id }, { onConflict: 'id' });

  if (profileError) throw profileError;

  return family.id;
};

export const sendFamilyInvite = async (familyId, email) => {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const { error } = await supabase
    .from('family_invitations')
    .insert({ family_id: familyId, email, invited_by: user.id });

  if (error) throw error;
};

export const fetchInvitations = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('family_invitations')
    .select('*, families(name)')
    .eq('email', user.email)
    .eq('status', 'pending');

  if (error) return [];
  return data;
};

export const acceptInvite = async (inviteId, familyId) => {
  const user = useAuthStore.getState().user;
  if (!user) return;

  // 1. Update invite status
  await supabase
    .from('family_invitations')
    .update({ status: 'accepted' })
    .eq('id', inviteId);

  // 2. Link user profile to family
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, family_id: familyId }, { onConflict: 'id' });

  if (error) throw error;
};

// Updated sync functions to use family_id context
export const syncMealPlanToDb = async (plan, familyId) => {
  if (!familyId) return;

  // Save local backup first
  localStorage.setItem(`epicurean-meal-plan-${familyId}`, JSON.stringify(plan));

  // Check if row already exists to bypass lack of unique constraint on family_id
  const { data: existing, error: selectError } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('family_id', familyId)
    .maybeSingle();

  if (selectError) {
    console.error("Error checking existing meal plan:", selectError);
  }

  let result;
  if (existing?.id) {
    result = await supabase
      .from('meal_plans')
      .update({ plan_data: plan })
      .eq('id', existing.id);
  } else {
    result = await supabase
      .from('meal_plans')
      .insert({ family_id: familyId, plan_data: plan });
  }
    
  if (result.error) console.error("Error syncing meal plan to DB (using local fallback):", result.error);
};

export const fetchMealPlanFromDb = async (familyId) => {
  if (!familyId) return null;

  let dbPlan = null;
  const { data, error } = await supabase
    .from('meal_plans')
    .select('plan_data')
    .eq('family_id', familyId)
    .single();

  if (!error) {
    dbPlan = data?.plan_data;
  } else if (error.code !== 'PGRST116') {
    console.error("Error fetching meal plan:", error);
  }

  // Retrieve local backup
  let localPlan = null;
  const stored = localStorage.getItem(`epicurean-meal-plan-${familyId}`);
  if (stored) {
    try {
      localPlan = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored meal plan:", e);
    }
  }

  return dbPlan || localPlan || null;
};

export const syncFamilyMembersToDb = async (members, familyId) => {
  if (!familyId) return;

  // Save local backup first
  localStorage.setItem(`epicurean-family-members-${familyId}`, JSON.stringify(members));

  const { error } = await supabase
    .from('family_members_data')
    .upsert({ family_id: familyId, members: members }, { onConflict: 'family_id' });
    
  if (error) console.error("Error syncing family members to DB (using local fallback):", error);
};

export const fetchFamilyMembersFromDb = async (familyId) => {
  if (!familyId) return null;

  let dbMembers = null;
  const { data, error } = await supabase
    .from('family_members_data')
    .select('members')
    .eq('family_id', familyId)
    .single();

  if (!error) {
    dbMembers = data?.members;
  } else if (error.code !== 'PGRST116') {
    console.error("Error fetching family members:", error);
  }

  // Retrieve local backup
  let localMembers = null;
  const stored = localStorage.getItem(`epicurean-family-members-${familyId}`);
  if (stored) {
    try {
      localMembers = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored family members:", e);
    }
  }

  return dbMembers || localMembers || null;
};

export const generateInviteLink = async (familyId) => {
  const user = useAuthStore.getState().user;
  if (!user || !familyId) return null;

  const token = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

  const { error } = await supabase
    .from('family_invitations')
    .insert({ 
      family_id: familyId, 
      token, 
      invited_by: user.id,
      email: 'link-invite@epicurean.ai', // Placeholder for generic link
      status: 'pending'
    });

  if (error) throw error;
  
  // Use the app's deep link scheme — works on any device with the app installed.
  // window.location.origin returns http://localhost inside a Capacitor WebView, not a real URL.
  return `epicurean.kitchen.app://join/${token}`;
};

export const fetchFamilyByInviteToken = async (token) => {
  const { data, error } = await supabase
    .from('family_invitations')
    .select('*, families(name)')
    .eq('token', token)
    .single();

  if (error) return null;
  return data;
};

export const joinFamilyWithToken = async (token) => {
  const user = useAuthStore.getState().user;
  if (!user) return;

  // 1. Get invite
  const invite = await fetchFamilyByInviteToken(token);
  if (!invite) throw new Error("Invalid or expired invite link.");

  // 2. Accept invite
  await acceptInvite(invite.id, invite.family_id);
  return invite.family_id;
};
export const syncPantryToDb = async (items) => {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const formattedItems = items.map(item => ({ ...item, user_id: user.id }));
  
  const { error } = await supabase
    .from('pantry_items')
    .upsert(formattedItems, { onConflict: 'id' });
    
  if (error) console.error("Error syncing pantry:", error);
};

export const fetchPantryFromDb = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error("Error fetching pantry:", error);
    return [];
  }
  return data;
};

export const deletePantryItemFromDb = async (id) => {
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id);
    
  if (error) console.error("Error deleting pantry item:", error);
};
