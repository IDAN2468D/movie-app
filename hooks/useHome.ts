import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useNowPlaying, 
  usePopular, 
  useTopRated,
  movieKeys 
} from '@/hooks/useMovieQueries';
import NotificationService from '@/services/NotificationService';

export const useHome = () => {
  const queryClient = useQueryClient();
  
  // 1. React Query Hooks
  const { data: nowPlaying = [], isLoading: isNpLoading, isRefetching: isNpRefetching } = useNowPlaying();
  const { data: popular = [], isLoading: isPopLoading, isRefetching: isPopRefetching } = usePopular();
  const { data: topRated = [], isLoading: isTrLoading, isRefetching: isTrRefetching } = useTopRated();

  // 2. Local UI State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [storiesVisible, setStoriesVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const loading = isNpLoading || isPopLoading || isTrLoading;
  const refreshing = isNpRefetching || isPopRefetching || isTrRefetching;

  // 3. Side Effects
  useEffect(() => {
    if (nowPlaying.length > 0 && !loading) {
      // Simulate new movie notification once when loaded
      NotificationService.notifyNewMovie(nowPlaying[0].title);
    }
  }, [nowPlaying.length, loading]);

  // 4. Action Handlers
  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: movieKeys.lists() });
  }, [queryClient]);

  const toggleAiModal = (visible: boolean) => {
    setAiModalVisible(visible);
  };

  const handleStoryPress = (index: number) => {
    setSelectedStoryIndex(index);
    setStoriesVisible(true);
  };

  const closeStories = () => {
    setStoriesVisible(false);
  };

  return {
    nowPlaying,
    popular,
    topRated,
    loading,
    refreshing,
    aiModalVisible,
    storiesVisible,
    selectedStoryIndex,
    onRefresh,
    toggleAiModal,
    handleStoryPress,
    closeStories,
  };
};
