import { useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getMovieDetails, type TMDBMovie } from '@/lib/tmdb';

export const useWatchlistScreen = () => {
  const movies = useWatchlistStore(state => state.movies);
  const addToWatchlist = useWatchlistStore(state => state.addToWatchlist);
  const removeFromWatchlist = useWatchlistStore(state => state.removeFromWatchlist);
  const { user, toggleFavorite } = useAuthStore();

  // Bidirectional synchronization effect between remote user.watchlist IDs and local high-fidelity movies
  useEffect(() => {
    if (!user?.watchlist) return;

    const syncWatchlist = async () => {
      const remoteIds = user.watchlist;
      const localIds = movies.map(m => m.id);

      // 1. Fetch missing details for any new movie IDs added remotely
      const missingIds = remoteIds.filter(id => !localIds.includes(id));
      if (missingIds.length > 0) {
        try {
          const promises = missingIds.map(id => getMovieDetails(id));
          const results = await Promise.all(promises);
          
          results.forEach(movie => {
            if (movie) {
              const tmdbMovie: TMDBMovie = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                vote_average: movie.vote_average,
                release_date: movie.release_date || '',
                genre_ids: movie.genres?.map((g: any) => g.id) || [],
                overview: movie.overview,
                popularity: movie.popularity,
                vote_count: movie.vote_count,
              };
              addToWatchlist(tmdbMovie);
            }
          });
        } catch (error) {
          console.error('[WatchlistSync] Failed to load remote watchlist details', error);
        }
      }

      // 2. Remove obsolete movies from local store that were removed remotely
      const obsoleteIds = localIds.filter(id => !remoteIds.includes(id));
      obsoleteIds.forEach(id => {
        removeFromWatchlist(id);
      });
    };

    syncWatchlist();
  }, [user?.watchlist, movies, addToWatchlist, removeFromWatchlist]);

  const handleRemove = useCallback((movieId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    removeFromWatchlist(movieId);
    
    // Also remove from remote auth store if it is currently favorited there
    const currentWatchlist = useAuthStore.getState().user?.watchlist || [];
    if (currentWatchlist.includes(movieId)) {
      toggleFavorite(movieId);
    }
  }, [removeFromWatchlist, toggleFavorite]);

  const handleMoviePress = useCallback((movie: TMDBMovie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/movie/[id]' as any, params: { id: movie.id } });
  }, []);

  return {
    movies,
    handleRemove,
    handleMoviePress,
  };
};
