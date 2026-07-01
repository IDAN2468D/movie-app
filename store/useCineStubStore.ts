import { create } from 'zustand';

export interface CineStubTicket {
  id: string;
  movieId: string;
  title: string;
  seat: string;
  row: string;
  date: string;
  imageUrl?: string;
  serialKey: string;
}

interface CineStubStore {
  collectibles: CineStubTicket[];
  activeCardId: string | null;
  unlockTicket: (ticket: CineStubTicket) => void;
  setActiveCardId: (id: string | null) => void;
  clearCache: () => void;
}

export const useCineStubStore = create<CineStubStore>((set) => ({
  collectibles: [],
  activeCardId: null,
  unlockTicket: (ticket) => set((state) => ({ 
    collectibles: state.collectibles.some(t => t.id === ticket.id) 
      ? state.collectibles 
      : [ticket, ...state.collectibles] 
  })),
  setActiveCardId: (id) => set({ activeCardId: id }),
  clearCache: () => set({ collectibles: [], activeCardId: null }),
}));

// Atomic selectors
export const selectCineStubCollectibles = (state: CineStubStore) => state.collectibles;
export const selectCineStubActiveCardId = (state: CineStubStore) => state.activeCardId;
export const selectUnlockTicket = (state: CineStubStore) => state.unlockTicket;
export const selectSetActiveCardId = (state: CineStubStore) => state.setActiveCardId;
export const selectClearCineStubCache = (state: CineStubStore) => state.clearCache;
