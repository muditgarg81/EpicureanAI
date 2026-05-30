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
  if (dietaryRestrictions) {
    payload.dietaryRestrictions = dietaryRestrictions.map(r => typeof r === 'object' ? JSON.stringify(r) : r);
  }
  
  // Save local backup first
  localStorage.setItem(`epicurean-profile-${user.id}`, JSON.stringify(payload));
  
  const { error } = await supabase
    .from('profiles')
    .upsert(payload);
    
  if (error) {
    console.error("Error syncing profile to DB, trying fallback:", error);
    // Always try fallback using update and stripping problematic columns
    const { activePlan: _ap, cuisines: _c, onboarded: _o, id: _id, created_at: _ca, updated_at: _ua, ...safeProfile } = payload;
    const { error: fallbackError } = await supabase
      .from('profiles')
      .update(safeProfile)
      .eq('id', user.id);
      
    if (fallbackError) {
      console.error("Fallback profile sync failed:", fallbackError);
    } else {
      console.log("Successfully synced profile with fallback");
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
  
  // Prefer local restrictions if they exist and are longer (meaning a sync failed previously)
  if (localProfile && localProfile.dietaryRestrictions && localProfile.dietaryRestrictions.length > 0) {
    if (!dbProfile || !dbProfile.dietaryRestrictions || localProfile.dietaryRestrictions.length > dbProfile.dietaryRestrictions.length) {
      merged.dietaryRestrictions = localProfile.dietaryRestrictions;
    }
  }

  if (!merged.activePlan) merged.activePlan = 'Taste';
  
  if (merged.plan_expires_at && new Date(merged.plan_expires_at) < new Date()) {
    merged.activePlan = 'Taste';
    merged.plan_expires_at = null;
    try {
      await supabase.from('profiles').update({ activePlan: 'Taste', plan_expires_at: null }).eq('id', user.id);
    } catch(e) {
      console.error("Failed to downgrade expired plan", e);
    }
  }

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
    .update({ family_id: family.id })
    .eq('id', user.id);

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
  const user = useAuthStore.getState().user;

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
      .insert({ family_id: familyId, plan_data: plan, user_id: user?.id });
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
    
  if (error) {
    console.error("Error syncing family members to DB (trying fallback):", error);
    // Unconditionally try stringified fallback
    const stringifiedMembers = members.map(m => typeof m === 'object' ? JSON.stringify(m) : m);
    const { error: fallbackErr } = await supabase
      .from('family_members_data')
      .upsert({ family_id: familyId, members: stringifiedMembers }, { onConflict: 'family_id' });
      
    if (fallbackErr) {
      console.error("Stringified upsert also failed, trying raw update fallback:", fallbackErr);
      await supabase
        .from('family_members_data')
        .update({ members: stringifiedMembers })
        .eq('family_id', familyId);
    }
  }
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
    if (data?.members && Array.isArray(data.members)) {
      dbMembers = data.members.map(m => typeof m === 'string' ? JSON.parse(m) : m);
    } else {
      dbMembers = data?.members;
    }
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

  if (dbMembers && dbMembers.length === 0 && localMembers && localMembers.length > 0) {
    return localMembers;
  }

  return (dbMembers && dbMembers.length > 0 ? dbMembers : null) || localMembers || null;
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
  
  // Always use a universal HTTPS link so it works on web browsers and messaging apps
  let baseUrl = window.location.origin;
  if (baseUrl.includes('localhost') || baseUrl.includes('capacitor://') || Capacitor.isNativePlatform() || baseUrl.includes('10.0.2.2')) {
    baseUrl = 'https://epicureanlabs.com';
  }
  return `${baseUrl}/join/${token}`;
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
