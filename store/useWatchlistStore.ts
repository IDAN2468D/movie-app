import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { type TMDBMovie } from '@/lib/tmdb';

interface WatchlistState {
  movies: TMDBMovie[];
  addToWatchlist: (movie: TMDBMovie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  clearWatchlist: () => void;
}

// Custom storage for SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      movies: [],
      
      addToWatchlist: (movie) => {
        const { movies } = get();
        if (!movies.some(m => m.id === movie.id)) {
          set({ movies: [movie, ...movies] });
        }
      },
      
      removeFromWatchlist: (movieId) => {
        const { movies } = get();
        set({ movies: movies.filter(m => m.id !== movieId) });
      },
      
      isInWatchlist: (movieId) => {
        return get().movies.some(m => m.id === movieId);
      },
      
      clearWatchlist: () => set({ movies: [] }),
    }),
    {
      name: 'cinebook-watchlist',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
