import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { getMovieDetails, type TMDBMovieDetails } from '@/lib/tmdb';

export const useFavorites = () => {
  const { user } = useAuthStore();
  const [movies, setMovies] = useState<TMDBMovieDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.watchlist || user.watchlist.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const promises = user.watchlist.map(id => getMovieDetails(id));
        const results = await Promise.all(promises);
        setMovies(results.filter(Boolean) as TMDBMovieDetails[]);
      } catch (error) {
        console.error('Failed to load favorites', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [user?.watchlist]);

  const goBack = () => router.back();

  return {
    movies,
    isLoading,
    goBack,
  };
};
