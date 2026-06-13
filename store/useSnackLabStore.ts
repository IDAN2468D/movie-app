import { create } from 'zustand';

export interface CustomSnack {
  butterLevel: number;
  sweetRatio: number;
  saltRatio: number;
  toppings: string[];
  priceModifier: number;
}

interface SnackLabState {
  currentCombo: CustomSnack;
  updateButterLevel: (level: number) => void;
  updateFlavorRatios: (sweet: number, salt: number) => void;
  addTopping: (topping: string) => void;
  removeTopping: (topping: string) => void;
  resetLab: () => void;
}

const DEFAULT_COMBO: CustomSnack = {
  butterLevel: 50,
  sweetRatio: 0,
  saltRatio: 100,
  toppings: [],
  priceModifier: 0,
};

export const useSnackLabStore = create<SnackLabState>((set) => ({
  currentCombo: { ...DEFAULT_COMBO },

  updateButterLevel: (level) => set((state) => {
    // Butter density adds a small surcharge if it exceeds 75%
    const extraPrice = level > 75 ? 3 : 0;
    const toppingsPrice = state.currentCombo.toppings.length * 4;
    return {
      currentCombo: {
        ...state.currentCombo,
        butterLevel: level,
        priceModifier: extraPrice + toppingsPrice,
      }
    };
  }),

  updateFlavorRatios: (sweet, salt) => set((state) => ({
    currentCombo: {
      ...state.currentCombo,
      sweetRatio: sweet,
      saltRatio: salt,
    }
  })),

  addTopping: (topping) => set((state) => {
    if (state.currentCombo.toppings.includes(topping)) return state;
    const nextToppings = [...state.currentCombo.toppings, topping];
    const extraPrice = state.currentCombo.butterLevel > 75 ? 3 : 0;
    const toppingsPrice = nextToppings.length * 4; // 4 NIS per candy/nut topping
    return {
      currentCombo: {
        ...state.currentCombo,
        toppings: nextToppings,
        priceModifier: extraPrice + toppingsPrice,
      }
    };
  }),

  removeTopping: (topping) => set((state) => {
    const nextToppings = state.currentCombo.toppings.filter((t) => t !== topping);
    const extraPrice = state.currentCombo.butterLevel > 75 ? 3 : 0;
    const toppingsPrice = nextToppings.length * 4;
    return {
      currentCombo: {
        ...state.currentCombo,
        toppings: nextToppings,
        priceModifier: extraPrice + toppingsPrice,
      }
    };
  }),

  resetLab: () => set({ currentCombo: { ...DEFAULT_COMBO } }),
}));
