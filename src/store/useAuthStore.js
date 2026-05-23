import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import useAppStore from './useAppStore';
import { Capacitor } from '@capacitor/core';

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  pendingInviteToken: null,
  setPendingInviteToken: (token) => set({ pendingInviteToken: token }),

  // Initialize auth state listener
  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user || null, loading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        const newUser = session?.user || null;
        set({ session, user: newUser });
        if (!newUser) {
          useAppStore.getState().resetStore();
        }
      });

      // Handle App Deep Links for OAuth & Invitations
      if (Capacitor.isNativePlatform()) {
        import('@capacitor/app').then(({ App }) => {
          App.addListener('appUrlOpen', async (data) => {
            if (!data || !data.url) {
              console.log('App opened but no URL was found in deep link data.');
              return;
            }
            console.log('App opened with URL:', data.url);
            
            // 1. Check for family join links
            if (data.url.includes('join/')) {
              const parts = data.url.split('join/');
              const token = parts[1]?.split(/[?#]/)[0];
              if (token) {
                console.log('Detected pending invite token in deep link:', token);
                set({ pendingInviteToken: token });
                return;
              }
            }

            // 2. Check for Google OAuth redirect
            const isAuthRedirect = data.url.includes('auth/callback') || data.url.includes('access_token=') || data.url.includes('code=') || data.url.includes('error=');
            if (isAuthRedirect) {
              try {
                const { Browser } = await import('@capacitor/browser');
                await Browser.close().catch(() => {});
              } catch (err) {
                console.error("Failed to close native browser:", err);
              }

              try {
                // Replace custom scheme to allow standard URL parsing
                const cleanUrl = data.url.replace('epicurean.kitchen.app://', 'https://');
                const parsedUrl = new URL(cleanUrl);

                // Handle OAuth callback errors
                const errorDesc = parsedUrl.searchParams.get('error_description') || parsedUrl.searchParams.get('error');
                if (errorDesc) {
                  alert("Google Sign-In Error: " + decodeURIComponent(errorDesc));
                  return;
                }

                // Handle PKCE code exchange
                const code = parsedUrl.searchParams.get('code');
                if (code) {
                  console.log('Exchanging authorization code for session...');
                  const { error } = await supabase.auth.exchangeCodeForSession(code);
                  if (error) {
                    alert("Google Code Exchange Failed: " + error.message);
                    throw error;
                  }
                  return;
                }

                // Handle implicit token session setting
                let hash = parsedUrl.hash;
                if (!hash && cleanUrl.includes('#')) {
                  hash = cleanUrl.split('#')[1];
                } else if (hash.startsWith('#')) {
                  hash = hash.substring(1);
                }

                if (hash) {
                  const params = new URLSearchParams(hash);
                  const access_token = params.get('access_token');
                  const refresh_token = params.get('refresh_token');
                  if (access_token && refresh_token) {
                    console.log('Setting session from access and refresh tokens...');
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (error) {
                      alert("Session Setup Failed: " + error.message);
                      throw error;
                    }
                  }
                }
              } catch (err) {
                console.error("Failed to parse and apply auth redirect:", err);
                alert("Redirect processing error: " + (err.message || err));
              }
            }
          });
        }).catch(err => {
          console.error("Failed to load native App plugin:", err);
        });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ loading: false });
    }
  },

  // Auth actions
  signInWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      const isNative = Capacitor.isNativePlatform();
      
      // Google OAuth REQUIRES an HTTPS redirect URL for Google Console, but Supabase handles that.
      // We pass our custom scheme here so Supabase redirects back to our app after Google auth finishes.
      const redirectTo = isNative
        ? `epicurean.kitchen.app://auth/callback`
        : `${window.location.origin}/discovery`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: isNative,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;

      if (isNative && data?.url) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
      }

      return data;
    } finally {
      set({ loading: false });
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      useAppStore.getState().resetStore();
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  }
}));

export default useAuthStore;
