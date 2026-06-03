import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Custom storage for SecureStore (Expo compatible)
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (e) {
      console.warn('Failed to get item from SecureStore:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (e) {
      console.warn('Failed to set item in SecureStore:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (e) {
      console.warn('Failed to delete item from SecureStore:', e);
    }
  },
};

interface PremiumState {
  isInTheaterMode: boolean;
  isGroupWatchActive: boolean;
  groupWatchRoomId: string | null;
  
  // Actions
  setInTheaterMode: (active: boolean) => void;
  toggleInTheaterMode: () => void;
  startGroupWatch: (roomId: string) => void;
  stopGroupWatch: () => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isInTheaterMode: false,
      isGroupWatchActive: false,
      groupWatchRoomId: null,

      setInTheaterMode: (active) => set({ isInTheaterMode: active }),
      toggleInTheaterMode: () => set((state) => ({ isInTheaterMode: !state.isInTheaterMode })),
      
      startGroupWatch: (roomId) => set({ isGroupWatchActive: true, groupWatchRoomId: roomId }),
      stopGroupWatch: () => set({ isGroupWatchActive: false, groupWatchRoomId: null }),
    }),
    {
      name: 'cinebook-premium-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
