import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { safeFetch } from './apiHelper';

import { API_BASE_URL } from '@/constants/Config';

const TOKEN_KEY = 'cinebook_auth_token';
const API_URL = API_BASE_URL; // Centralized API URL

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
      const result = await safeFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (result.success) {
        const { token, user } = result.data;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
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
        console.log('Saving token to SecureStore and updating state...');
        await SecureStore.setItemAsync(TOKEN_KEY, token);
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
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const hasSeen = await SecureStore.getItemAsync('cinebook_has_seen_onboarding');
      const biometricsPref = await SecureStore.getItemAsync('cinebook_biometrics_enabled');
      const twoFactorPref = await SecureStore.getItemAsync('cinebook_2fa_enabled');
      
      set({ 
        hasSeenOnboarding: hasSeen === 'true',
        biometricsEnabled: biometricsPref === 'true',
        twoFactorEnabled: twoFactorPref === 'true'
      });

      if (!token) {
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }
      
      const result = await safeFetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (result.success) {
        set({ token, user: result.data, isAuthenticated: true, isLoading: false });
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false });
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
