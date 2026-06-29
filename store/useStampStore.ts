import { create } from 'zustand';

export interface Stamp {
  id: string;
  movieId: string;
  movieTitle: string;
  stampImage: string;
  timestamp: number;
}

interface StampStore {
  stamps: Stamp[];
  addStamp: (stamp: Stamp) => void;
  clearStamps: () => void;
}

export const useStampStore = create<StampStore>((set) => ({
  stamps: [],
  addStamp: (stamp) => set((state) => ({ stamps: [stamp, ...state.stamps] })),
  clearStamps: () => set({ stamps: [] }),
}));

// Atomic selectors
export const selectStamps = (state: StampStore) => state.stamps;
export const selectAddStamp = (state: StampStore) => state.addStamp;
export const selectClearStamps = (state: StampStore) => state.clearStamps;
