import { create } from 'zustand';
import { AIService } from '../services/AIService';

interface CineSnacksAIStore {
  recommendedIds: string[];
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: (movieTitle: string, genre?: string, format?: string, time?: string) => Promise<void>;
  clearRecommendations: () => void;
}

export const useCineSnacksAIStore = create<CineSnacksAIStore>((set) => ({
  recommendedIds: [],
  isLoading: false,
  error: null,
  fetchRecommendations: async (movieTitle, genre, format, time) => {
    if (!movieTitle) return;
    set({ isLoading: true, error: null });
    try {
      // Assuming AIService.getSnackRecommendations can take genre as well, 
      // or we pass it as part of context if the signature allows it.
      // Based on existing code it takes (movieTitle, format, time)
      const ids = await AIService.getSnackRecommendations(movieTitle, format, time);
      set({ recommendedIds: ids, isLoading: false });
    } catch (err: any) {
      console.error('[CineSnacksAIStore] Failed to fetch AI recommendations:', err);
      set({ error: err.message || 'Failed to fetch recommendations', isLoading: false });
    }
  },
  clearRecommendations: () => set({ recommendedIds: [], error: null }),
}));
