import { create } from 'zustand';

export interface PassDetails {
  passId: string;
  movieTitle: string;
  hallName: string;
  seatNumber: string;
  nfcStatus: 'ready' | 'tapping' | 'granted';
}

interface CinePassState {
  currentPass: PassDetails;
  triggerTap: () => void;
  resetTap: () => void;
}

export const useCinePassStore = create<CinePassState>((set) => ({
  currentPass: {
    passId: 'PASS-99201',
    movieTitle: 'גלדיאטור II',
    hallName: 'אולם VIP 3',
    seatNumber: 'שורה 4, מושב 12',
    nfcStatus: 'ready',
  },
  triggerTap: () =>
    set((state) => ({
      currentPass: { ...state.currentPass, nfcStatus: 'granted' },
    })),
  resetTap: () =>
    set((state) => ({
      currentPass: { ...state.currentPass, nfcStatus: 'ready' },
    })),
}));
