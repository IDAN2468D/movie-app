import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AsyncStorage } from '@/utils/SafeModules';
import { type TMDBMovie } from '@/lib/tmdb';

interface WatchlistState {
  movies: TMDBMovie[];
  addToWatchlist: (movie: TMDBMovie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  clearWatchlist: () => void;
}

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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
