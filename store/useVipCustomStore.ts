/**
 * useVipCustomStore.ts
 * Manages per-seat VIP customization settings for CineBook.
 * Each VIP seat can have its own recline, leg-rest, heating, and amenity config.
 */

import { create } from 'zustand';

export type HeatingLevel = 0 | 1 | 2 | 3; // 0=Off, 1=Low, 2=Medium, 3=High

export interface VipSeatConfig {
  reclineAngle: number;   // 0–100 (0 = upright, 100 = fully reclined)
  legRestAngle: number;   // 0–100 (0 = flat, 100 = fully raised)
  heatingLevel: HeatingLevel;
  hasBlanket: boolean;
  hasPillow: boolean;
}

const DEFAULT_CONFIG: VipSeatConfig = {
  reclineAngle: 0,
  legRestAngle: 0,
  heatingLevel: 0,
  hasBlanket: false,
  hasPillow: false,
};

interface VipCustomState {
  configs: Record<string, VipSeatConfig>; // key = `${row}-${number}`
  updateSeatConfig: (row: string, number: number, patch: Partial<VipSeatConfig>) => void;
  getSeatConfig: (row: string, number: number) => VipSeatConfig;
  hasCustomization: (row: string, number: number) => boolean;
  clearConfigs: () => void;
}

export const useVipCustomStore = create<VipCustomState>((set, get) => ({
  configs: {},

  updateSeatConfig: (row, number, patch) => {
    const key = `${row}-${number}`;
    const existing = get().configs[key] ?? { ...DEFAULT_CONFIG };
    set((state) => ({
      configs: {
        ...state.configs,
        [key]: { ...existing, ...patch },
      },
    }));
  },

  getSeatConfig: (row, number) => {
    const key = `${row}-${number}`;
    return get().configs[key] ?? { ...DEFAULT_CONFIG };
  },

  hasCustomization: (row, number) => {
    const cfg = get().getSeatConfig(row, number);
    return (
      cfg.reclineAngle > 0 ||
      cfg.legRestAngle > 0 ||
      cfg.heatingLevel > 0 ||
      cfg.hasBlanket ||
      cfg.hasPillow
    );
  },

  clearConfigs: () => set({ configs: {} }),
}));
