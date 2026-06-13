import { create } from 'zustand';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

export interface ILegacyData {
  genreRatios: Record<string, number>;
  totalWatchTime: number;
  legacyLevel: number;
  rankName: string;
  totalTickets: number;
}

interface LegacyState {
  legacyData: ILegacyData | null;
  isLoading: boolean;
  error: string | null;

  fetchLegacy: () => Promise<void>;
  clearLegacy: () => void;
}

export const useLegacyStore = create<LegacyState>((set) => ({
  legacyData: null,
  isLoading: false,
  error: null,

  fetchLegacy: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'משתמש לא מחובר' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await safeFetch(`${API_BASE_URL}/legacy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.success && response.data) {
        set({
          legacyData: response.data,
          isLoading: false,
        });
      } else {
        set({
          error: response.message || 'שגיאה בטעינת נתוני מורשת',
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: 'שגיאת תקשורת עם השרת',
        isLoading: false,
      });
    }
  },

  clearLegacy: () => {
    set({ legacyData: null, isLoading: false, error: null });
  },
}));

// Strict selectors for optimized rendering
export const useLegacyData = () => useLegacyStore((state) => state.legacyData);
export const useLegacyIsLoading = () => useLegacyStore((state) => state.isLoading);
export const useLegacyError = () => useLegacyStore((state) => state.error);
export const useLegacyActions = () => {
  const fetchLegacy = useLegacyStore((state) => state.fetchLegacy);
  const clearLegacy = useLegacyStore((state) => state.clearLegacy);
  return { fetchLegacy, clearLegacy };
};
