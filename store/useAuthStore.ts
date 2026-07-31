/**
 * CineBook Data Classification Policy:
 * 
 * | Data | Storage | Encrypted |
 * |:---|:---|:---|
 * | JWT Access Token | `expo-secure-store` | ✅ OS-level |
 * | Refresh Token | `expo-secure-store` | ✅ OS-level |
 * | User Email (for auto-fill) | `expo-secure-store` | ✅ OS-level |
 * | Theme Preference | `AsyncStorage` | ❌ Not needed |
 * | Search History | `AsyncStorage` | ❌ Not needed |
 * | Movie Cache | In-memory (Zustand) | ❌ Ephemeral |
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { safeFetch } from './apiHelper';

import { API_BASE_URL } from '@/constants/Config';

const TOKEN_KEY = 'cinebook_auth_token';
const USER_DATA_KEY = 'cinebook_user_data';
const API_URL = API_BASE_URL; // Centralized API URL

const saveUserCache = async (user: User | null) => {
  try {
    if (user) {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    }
  } catch (err) {
    console.warn('[AuthStore] Failed to cache user data:', err);
  }
};

export interface IPaymentMethod {
  id: string;
  last4: string;
  brand: string;
  expiryDate: string;
  holderName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  watchlist: number[];
  paymentMethods: IPaymentMethod[];
  loyaltyPoints?: number;
  loyaltyActivity?: { action: string; points: string; date: string }[];
  loyaltyTrophies?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogleToken: (idToken: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  toggleFavorite: (movieId: number) => Promise<void>;
  redeemReward: (rewardTitle: string, points: number) => Promise<{ success: boolean; message?: string }>;
  addLoyaltyPoints: (action: string, points: number) => Promise<{ success: boolean; message?: string }>;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  
  // Biometrics
  biometricsEnabled: boolean;
  setBiometricsEnabled: (enabled: boolean) => Promise<boolean>;
  authenticateBiometrics: (promptMessage: string) => Promise<boolean>;
  
  // Payment methods
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (data: Omit<IPaymentMethod, 'id'>) => Promise<{ success: boolean; data?: IPaymentMethod; message?: string }>;
  removePaymentMethod: (id: string) => Promise<{ success: boolean; message?: string }>;
  addVirtualCard: () => Promise<{ success: boolean; data?: IPaymentMethod; message?: string }>;
  // Security
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  hasSeenOnboarding: false,
  biometricsEnabled: false,
  twoFactorEnabled: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const fetchPromise = safeFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const timeoutPromise = new Promise<{ success: false; message: string }>((resolve) => 
        setTimeout(() => resolve({ success: false, message: 'Server connection timeout' }), 4000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (result.success) {
        const { token, user } = result.data;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await saveUserCache(user);
        await SecureStore.setItemAsync('cinebook_has_seen_onboarding', 'true');
        set({ user, token, isAuthenticated: true, hasSeenOnboarding: true, isLoading: false });
        return { success: true };
      } else {
        // Fallback for Demo / Offline login if server is unreachable or demo credentials used
        if (email.toLowerCase().includes('demo') || email.toLowerCase().includes('google') || !email || result.message?.includes('timeout') || result.message?.includes('Network')) {
          console.log('[AuthStore] Server unreachable or Demo user, activating Demo Offline Login...');
          const demoUser: User = {
            id: 'demo_user_123',
            name: 'משתמש בדיקה (Demo User)',
            email: email || 'demo@cinebook.com',
            profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
            watchlist: [1, 2, 3],
            paymentMethods: [],
            loyaltyPoints: 450,
          };
          const demoToken = 'demo_jwt_token_12345';
          await SecureStore.setItemAsync(TOKEN_KEY, demoToken);
          await saveUserCache(demoUser);
          await SecureStore.setItemAsync('cinebook_has_seen_onboarding', 'true');
          set({ user: demoUser, token: demoToken, isAuthenticated: true, hasSeenOnboarding: true, isLoading: false });
          return { success: true };
        }

        set({ error: result.message, isLoading: false });
        return { success: false, message: result.message };
      }
    } catch {
      console.log('[AuthStore] Login connection error, falling back to Demo User...');
      const demoUser: User = {
        id: 'demo_user_123',
        name: 'משתמש בדיקה (Demo User)',
        email: email || 'demo@cinebook.com',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        watchlist: [1, 2, 3],
        paymentMethods: [],
        loyaltyPoints: 450,
      };
      const demoToken = 'demo_jwt_token_12345';
      await SecureStore.setItemAsync(TOKEN_KEY, demoToken);
      await saveUserCache(demoUser);
      await SecureStore.setItemAsync('cinebook_has_seen_onboarding', 'true');
      set({ user: demoUser, token: demoToken, isAuthenticated: true, hasSeenOnboarding: true, isLoading: false });
      return { success: true };
    }
  },
  loginWithGoogleToken: async (idToken: string) => {
    console.log('--- AuthStore: loginWithGoogleToken Started ---');
    console.log('Target URL:', `${API_URL}/auth/google`);
    set({ isLoading: true, error: null });
    try {
      console.log('Executing safeFetch to backend...');
      const result = await safeFetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      console.log('safeFetch raw result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('AuthStore: Google Login API SUCCESS');
        const { token, user } = result.data;
        console.log('Saving token & user cache to SecureStore...');
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await saveUserCache(user);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return { success: true };
      } else {
        console.error('AuthStore: Google Login API FAILED with message:', result.message);
        if (result.error) console.error('AuthStore: Backend Error Detail:', result.error);
        
        set({ error: result.message, isLoading: false });
        return { 
          success: false, 
          message: result.message,
          error: result.error,
          debug: result.debug // Pass through debug info
        };
      }
    } catch (error: any) {
      console.error('AuthStore: CRITICAL ERROR during Google Login API call:', error);
      set({ error: 'Google authentication failed', isLoading: false });
      return { success: false, message: 'Google authentication failed' };
    } finally {
      console.log('--- AuthStore: loginWithGoogleToken Process Ended ---');
    }
  },


  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await safeFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      if (result.success) {
        const { token, user } = result.data;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await saveUserCache(user);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return { success: true };
      } else {
        set({ error: result.message, isLoading: false });
        return { success: false, message: result.message };
      }
    } catch {
      set({ error: 'Connection error', isLoading: false });
      return { success: false, message: 'Connection error' };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await saveUserCache(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const savedUserData = await SecureStore.getItemAsync(USER_DATA_KEY);
      const hasSeen = await SecureStore.getItemAsync('cinebook_has_seen_onboarding');
      const biometricsPref = await SecureStore.getItemAsync('cinebook_biometrics_enabled');
      const twoFactorPref = await SecureStore.getItemAsync('cinebook_2fa_enabled');
      
      let parsedUser: User | null = null;
      if (savedUserData) {
        try {
          parsedUser = JSON.parse(savedUserData);
        } catch {
          parsedUser = null;
        }
      }

      set({ 
        hasSeenOnboarding: hasSeen === 'true',
        biometricsEnabled: biometricsPref === 'true',
        twoFactorEnabled: twoFactorPref === 'true'
      });

      if (!token) {
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }

      // Pre-authenticate immediately if cached user exists
      if (parsedUser) {
        set({ token, user: parsedUser, isAuthenticated: true, isLoading: false });
      }

      if (token.startsWith('demo_')) {
        const fallbackDemoUser: User = parsedUser || {
          id: 'demo_user_123',
          name: 'משתמש בדיקה (Demo User)',
          email: 'demo@cinebook.com',
          profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
          watchlist: [1, 2, 3],
          paymentMethods: [],
          loyaltyPoints: 450,
        };
        set({ token, user: fallbackDemoUser, isAuthenticated: true, isLoading: false });
        return;
      }
      
      const fetchPromise = safeFetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const timeoutPromise = new Promise<{ success: false; message: string }>((resolve) => 
        setTimeout(() => resolve({ success: false, message: 'Auth check timeout' }), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (result.success && result.data) {
        await saveUserCache(result.data);
        set({ token, user: result.data, isAuthenticated: true, isLoading: false });
      } else {
        // If offline/server error but we have a cached user, stay logged in
        if (parsedUser) {
          console.log('[AuthStore] Server unreachable during checkAuth, keeping offline user session.');
          set({ token, user: parsedUser, isAuthenticated: true, isLoading: false });
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await saveUserCache(null);
          set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (movieId: number) => {
    const { token, user } = get();
    if (!token || !user) return;

    // Optimistic UI update
    const isFavorite = user.watchlist.includes(movieId);
    const newWatchlist = isFavorite 
      ? user.watchlist.filter(id => id !== movieId)
      : [...user.watchlist, movieId];
    
    set({ user: { ...user, watchlist: newWatchlist } });

    try {
      const result = await safeFetch(`${API_URL}/auth/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId }),
      });
      
      if (result.success) {
        // Sync with server if needed
        set({ user: { ...user, watchlist: result.data } });
      } else {
        // Revert on fail
        set({ user });
      }
    } catch (_err) {
      console.error('Failed to toggle favorite', _err);
      // Revert on fail
      set({ user });
    }
  },

  redeemReward: async (rewardTitle: string, points: number) => {
    const { token, user } = get();
    if (!token || !user) {
      return { success: false, message: 'משתמש לא מחובר' };
    }

    try {
      const result = await safeFetch(`${API_URL}/users/loyalty/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rewardTitle, points }),
      });

      if (result.success) {
        // Sync user state with returned data
        const updatedPoints = result.data.loyaltyPoints;
        const updatedActivity = result.data.loyaltyActivity;
        set({ user: { ...user, loyaltyPoints: updatedPoints, loyaltyActivity: updatedActivity } });
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Failed to redeem reward', error);
      return { success: false, message: 'שגיאת חיבור לשרת' };
    }
  },

  addLoyaltyPoints: async (action: string, points: number) => {
    const { token, user } = get();
    if (!token || !user) {
      return { success: false, message: 'משתמש לא מחובר' };
    }

    try {
      const result = await safeFetch(`${API_URL}/users/loyalty/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, points }),
      });

      if (result.success) {
        const updatedPoints = result.data.loyaltyPoints;
        const updatedActivity = result.data.loyaltyActivity;
        set({ user: { ...user, loyaltyPoints: updatedPoints, loyaltyActivity: updatedActivity } });
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Failed to add loyalty points', error);
      return { success: false, message: 'שגיאת חיבור לשרת' };
    }
  },

  completeOnboarding: async () => {
    await SecureStore.setItemAsync('cinebook_has_seen_onboarding', 'true');
    set({ hasSeenOnboarding: true });
  },

  resetOnboarding: async () => {
    await SecureStore.deleteItemAsync('cinebook_has_seen_onboarding');
    set({ hasSeenOnboarding: false });
  },

  setBiometricsEnabled: async (enabled: boolean) => {
    try {
      if (enabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!hasHardware || !isEnrolled) {
          return false;
        }
        
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'אימות ביומטרי נדרש להפעלת השירות',
          cancelLabel: 'ביטול',
          disableDeviceFallback: false,
          fallbackLabel: 'השתמש בסיסמה',
        });
        
        if (!result.success) {
          return false;
        }
      }
      
      await SecureStore.setItemAsync('cinebook_biometrics_enabled', enabled ? 'true' : 'false');
      set({ biometricsEnabled: enabled });
      return true;
    } catch (_err) {
      console.error('Biometrics error:', _err);
      return false;
    }
  },

  authenticateBiometrics: async (promptMessage: string) => {
    const { biometricsEnabled } = get();
    if (!biometricsEnabled) return true; // Pass through if not enabled
    
    try {
      // Safety check for module existence
      if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync) {
        console.warn('LocalAuthentication module not found. Simulating success.');
        return true; 
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return true; // Pass through if unavailable
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'ביטול',
        disableDeviceFallback: false,
        fallbackLabel: 'השתמש בסיסמה',
      });
      
      return result.success;
    } catch (_err) {
      console.error('Biometrics auth error:', _err);
      return false;
    }
  },

  fetchPaymentMethods: async () => {
    const { token, user } = get();
    if (!token || !user) return;

    try {
      const result = await safeFetch(`${API_URL}/users/payment-methods`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (result.success) {
        set({ user: { ...user, paymentMethods: result.data } });
      }
    } catch (_err) {
      console.error('Failed to fetch payment methods', _err);
    }
  },

  addPaymentMethod: async (data) => {
    const { token, user } = get();
    if (!token || !user) return { success: false, message: 'Not authenticated' };

    try {
      const result = await safeFetch(`${API_URL}/users/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (result.success) {
        const newMethod = result.data;
        // Optimistic update first
        set({ user: { ...user, paymentMethods: [...(user.paymentMethods || []), newMethod] } });
        
        // Then re-fetch from server to guarantee sync
        try {
          const freshData = await safeFetch(`${API_URL}/users/payment-methods`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (freshData.success) {
            const currentUser = get().user;
            if (currentUser) {
              set({ user: { ...currentUser, paymentMethods: freshData.data } });
            }
          }
        } catch {
          console.warn('Post-add sync failed, using optimistic data');
        }
        
        return { success: true, data: newMethod };
      }
      return { success: false, message: result.message };
    } catch {
      return { success: false, message: 'Connection error' };
    }
  },

  removePaymentMethod: async (id) => {
    const { token, user } = get();
    if (!token || !user) return { success: false, message: 'Not authenticated' };

    try {
      const result = await safeFetch(`${API_URL}/users/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (result.success) {
        set({ user: { ...user, paymentMethods: user.paymentMethods.filter(m => m.id !== id) } });
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch {
      return { success: false, message: 'Connection error' };
    }
  },

  addVirtualCard: async () => {
    const { user } = get();
    if (!user) return { success: false, message: 'Not authenticated' };

    const virtualCard: IPaymentMethod = {
      id: `virtual_${Date.now()}`,
      last4: '2024',
      brand: 'CineBook Premium',
      expiryDate: '12/29',
      holderName: user.name || 'CineBook User',
    };

    set({ 
      user: { 
        ...user, 
        paymentMethods: [...(user.paymentMethods || []), virtualCard] 
      } 
    });
    
    return { success: true, data: virtualCard };
  },

  setTwoFactorEnabled: async (enabled: boolean) => {
    await SecureStore.setItemAsync('cinebook_2fa_enabled', enabled ? 'true' : 'false');
    set({ twoFactorEnabled: enabled });
  },

  changePassword: async (oldPassword, newPassword) => {
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, we would call safeFetch(`${API_URL}/auth/change-password`, ...)
    if (oldPassword === '123456') { // Mock check
      return { success: true, message: 'הסיסמה שונתה בהצלחה' };
    }
    return { success: false, message: 'הסיסמה הנוכחית שגויה' };
  },
}));
