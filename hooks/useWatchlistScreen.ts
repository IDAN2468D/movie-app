import { useCallback } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { type TMDBMovie } from '@/lib/tmdb';

export const useWatchlistScreen = () => {
  const movies = useWatchlistStore(state => state.movies);
  const removeFromWatchlist = useWatchlistStore(state => state.removeFromWatchlist);

  const handleRemove = useCallback((movieId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    removeFromWatchlist(movieId);
  }, [removeFromWatchlist]);

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
