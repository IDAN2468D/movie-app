import { create } from 'zustand';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

export interface IPredictionPrompt {
  id: string;
  question: string;
  options: string[];
  odds: number[];
}

export interface IBet {
  _id: string;
  movieId: number;
  predictionId: string;
  question: string;
  userChoice: string;
  betAmount: number;
  odds: number;
  isResolved: boolean;
  status: 'pending' | 'won' | 'lost';
}

interface OracleState {
  predictions: IPredictionPrompt[];
  userBets: IBet[];
  isLoading: boolean;
  error: string | null;

  fetchPredictions: (movieId: number, movieTitle: string, genres: string) => Promise<void>;
  fetchUserBets: () => Promise<void>;
  placeBet: (
    movieId: number,
    predictionId: string,
    question: string,
    userChoice: string,
    betAmount: number,
    odds: number
  ) => Promise<{ success: boolean; message?: string }>;
}

export const useOracleStore = create<OracleState>((set) => ({
  predictions: [],
  userBets: [],
  isLoading: false,
  error: null,

  fetchPredictions: async (movieId, movieTitle, genres) => {
    set({ isLoading: true, error: null });
    const response = await safeFetch(
      `${API_BASE_URL}/oracle/movie/${movieId}?title=${encodeURIComponent(movieTitle)}&genres=${encodeURIComponent(genres)}`
    );
    if (response.success && response.data) {
      set({ predictions: response.data, isLoading: false });
    } else {
      set({ error: response.message || 'Failed to fetch predictions', isLoading: false });
    }
  },

  fetchUserBets: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const response = await safeFetch(`${API_BASE_URL}/oracle/bets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.success && response.data) {
      set({ userBets: response.data });
    }
  },

  placeBet: async (movieId, predictionId, question, userChoice, betAmount, odds) => {
    set({ isLoading: true });
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ isLoading: false });
      return { success: false, message: 'עליך להתחבר כדי לבצע הימור עלילה' };
    }

    const response = await safeFetch(`${API_BASE_URL}/oracle/bet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        movieId,
        predictionId,
        question,
        userChoice,
        betAmount,
        odds
      })
    });

    if (response.success && response.data) {
      // Update local loyalty points in auth store
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.setState({
          user: {
            ...user,
            loyaltyPoints: response.data.userPoints
          }
        });
      }

      set((state) => ({
        userBets: [response.data.bet, ...state.userBets],
        isLoading: false
      }));

      return { success: true, message: response.message };
    } else {
      set({ isLoading: false });
      return { success: false, message: response.message || 'Failed to place bet' };
    }
  }
}));
