import { create } from 'zustand';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

export interface CollectibleItem {
  id: string;
  _id?: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  genre: string;
  badgeType: 'bronze' | 'silver' | 'gold' | 'glass';
  shardId: string;
  earnedAt: string | Date;
}

interface VaultState {
  collectibles: CollectibleItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCollectibles: () => Promise<void>;
  syncCollectibles: () => Promise<{ success: boolean; message?: string }>;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  collectibles: [],
  isLoading: false,
  error: null,

  fetchCollectibles: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'משתמש אינו מחובר', collectibles: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await safeFetch(`${API_BASE_URL}/vault`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (result.success) {
        set({ collectibles: result.data || [], isLoading: false });
      } else {
        set({ error: result.message || 'שגיאה בטעינת הכספת', isLoading: false });
      }
    } catch {
      set({ error: 'שגיאת חיבור לשרת', isLoading: false });
    }
  },

  syncCollectibles: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      return { success: false, message: 'משתמש אינו מחובר' };
    }

    set({ isLoading: true, error: null });
    try {
      const result = await safeFetch(`${API_BASE_URL}/vault/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (result.success) {
        set({ collectibles: result.data || [], isLoading: false });
        // Also refresh user profile to update loyaltyPoints/Activity!
        useAuthStore.getState().checkAuth();
        return { success: true, message: result.message };
      } else {
        set({ error: result.message || 'שגיאה בסנכרון הכספת', isLoading: false });
        return { success: false, message: result.message };
      }
    } catch {
      set({ error: 'שגיאת חיבור לשרת', isLoading: false });
      return { success: false, message: 'שגיאת חיבור לשרת' };
    }
  },

  clearVault: () => set({ collectibles: [], error: null })
}));
