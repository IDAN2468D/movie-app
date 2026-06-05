import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AsyncStorage } from '../utils/SafeModules';

export type CineEffectMode = 'glow' | 'liquid' | 'gyro' | 'plasma';

interface CineEffectsState {
  currentEffect: CineEffectMode;
  setEffect: (effect: CineEffectMode) => void;
}

export const useCineEffectsStore = create<CineEffectsState>()(
  persist(
    (set) => ({
      currentEffect: 'glow',
      setEffect: (effect) => set({ currentEffect: effect }),
    }),
    {
      name: 'cinebook-effects-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
