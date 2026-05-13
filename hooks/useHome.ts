import { useEffect, useState } from 'react';
import { getNowPlaying, getPopular, getTopRated, type TMDBMovie } from '@/lib/tmdb';
import { NotificationService } from '@/services/NotificationService';

export const useHome = () => {
  const [nowPlaying, setNowPlaying] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const fetchMovies = async () => {
    try {
      const [np, pop, tr] = await Promise.all([
        getNowPlaying(),
        getPopular(),
        getTopRated(),
      ]);
      setNowPlaying(np);
      setPopular(pop);
      setTopRated(tr);

      // Simulate new movie notification if we have data
      if (np.length > 0) {
        NotificationService.notifyNewMovie(np[0].title);
      }
    } catch (error) {
      console.error('[useHome] Failed to fetch movies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovies();
  };

  const toggleAiModal = (visible: boolean) => {
    setAiModalVisible(visible);
  };

  return {
    nowPlaying,
    popular,
    topRated,
    loading,
    refreshing,
    aiModalVisible,
    onRefresh,
    toggleAiModal,
  };
};
