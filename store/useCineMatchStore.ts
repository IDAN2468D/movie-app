import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AsyncStorage } from '@/utils/SafeModules';
import { type TMDBMovie } from '@/lib/tmdb';
import { useWatchlistStore } from './useWatchlistStore';
import { useAuthStore } from './useAuthStore';

interface CineMatchState {
  // Swiped states
  likedMovieIds: number[];
  skippedMovieIds: number[];
  matches: TMDBMovie[];
  
  // Group Mode States
  isGroupMode: boolean;
  roomId: string | null;
  
  // Actions
  setGroupMode: (active: boolean) => void;
  createRoom: () => string;
  joinRoom: (id: string) => boolean;
  leaveRoom: () => void;
  
  swipeMovie: (movie: TMDBMovie, liked: boolean) => { isMatch: boolean };
  resetCineMatch: () => void;
}

export const useCineMatchStore = create<CineMatchState>()(
  persist(
    (set, get) => ({
      likedMovieIds: [],
      skippedMovieIds: [],
      matches: [],
      isGroupMode: false,
      roomId: null,

      setGroupMode: (active) => {
        set({ isGroupMode: active });
      },

      createRoom: () => {
        const randomCode = `MATCH-${Math.floor(100 + Math.random() * 900)}`;
        set({ isGroupMode: true, roomId: randomCode });
        return randomCode;
      },

      joinRoom: (id) => {
        const cleaned = id.trim().toUpperCase();
        if (cleaned.length < 5) return false;
        set({ isGroupMode: true, roomId: cleaned });
        return true;
      },

      leaveRoom: () => {
        set({ isGroupMode: false, roomId: null });
      },

      swipeMovie: (movie, liked) => {
        const { likedMovieIds, skippedMovieIds, matches, isGroupMode } = get();
        
        if (liked) {
          // 1. Add to local CineMatch liked ids
          const updatedLikes = [...likedMovieIds];
          if (!updatedLikes.includes(movie.id)) {
            updatedLikes.push(movie.id);
          }
          
          // 2. Add to global Watchlist store automatically as per specs
          useWatchlistStore.getState().addToWatchlist(movie);
          
          // Also sync to remote auth store if authenticated and not already favorited
          const { user, toggleFavorite } = useAuthStore.getState();
          if (user && !user.watchlist.includes(movie.id)) {
            toggleFavorite(movie.id);
          }
          
          // 3. Check for Group Match simulation
          let isMatch = false;
          const updatedMatches = [...matches];
          
          if (isGroupMode) {
            // Simulated 40% match rate when swiping right in group watch mode
            isMatch = Math.random() < 0.4;
            if (isMatch) {
              if (!updatedMatches.some(m => m.id === movie.id)) {
                updatedMatches.push(movie);
              }
            }
          }

          set({
            likedMovieIds: updatedLikes,
            matches: updatedMatches,
          });

          return { isMatch };
        } else {
          // Swipe Left (Skip)
          const updatedSkips = [...skippedMovieIds];
          if (!updatedSkips.includes(movie.id)) {
            updatedSkips.push(movie.id);
          }

          set({
            skippedMovieIds: updatedSkips,
          });

          return { isMatch: false };
        }
      },

      resetCineMatch: () => {
        set({
          likedMovieIds: [],
          skippedMovieIds: [],
          matches: [],
        });
      },
    }),
    {
      name: 'cinebook-cinematch-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        likedMovieIds: state.likedMovieIds,
        skippedMovieIds: state.skippedMovieIds,
        matches: state.matches,
        isGroupMode: state.isGroupMode,
        roomId: state.roomId,
      }),
    }
  )
);
