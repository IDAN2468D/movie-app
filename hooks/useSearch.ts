/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Keyboard, Animated } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { 
  usePopular, 
  useSearchMovies, 
  useDiscoverMovies, 
  useMoviesByGenre 
} from '@/hooks/useMovieQueries';
import { AIService } from '@/services/AIService';

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [isAISearch, setIsAISearch] = useState(false);
  const [searched, setSearched] = useState(false);
  const [aiFilters, setAiFilters] = useState<Record<string, string>>({});
  const [manualFilters, setManualFilters] = useState<Record<string, string | null>>({});
  const [isAiLoading, setIsAiLoading] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Reanimated focus states
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused]);

  // React Query Hooks
  const { data: popularData = [] } = usePopular();
  const popular = useMemo(() => popularData.slice(0, 6), [popularData]);

  const aiFailed = isAISearch && Object.keys(aiFilters).length === 0;
  const shouldDisableTextSearch = isAISearch && !aiFilters.query && !aiFailed;
  const { data: searchResults = [], isLoading: isSearchLoading } = useSearchMovies(query, shouldDisableTextSearch);
  const { data: genreResults = [], isLoading: isGenreLoading } = useMoviesByGenre(activeGenre);
  
  const activeFilters = useMemo(() => {
    const rawFilters = isAISearch ? aiFilters : manualFilters;
    const params: Record<string, string> = {};

    // Map AI's TMDB keys directly
    Object.keys(rawFilters).forEach(key => {
      if (key !== 'query' && key !== 'genre' && key !== 'rating' && key !== 'language' && key !== 'runtime' && key !== 'vote_count' && key !== 'certification') {
        params[key] = rawFilters[key] as string;
      }
    });

    // Map internal/UI keys to TMDB keys
    if (rawFilters.genre) params.with_genres = rawFilters.genre as string;
    if (rawFilters.rating) params['vote_average.gte'] = rawFilters.rating as string;
    if (rawFilters.language) params.with_original_language = rawFilters.language as string;
    if (rawFilters.primary_release_year) params.primary_release_year = rawFilters.primary_release_year as string;
    if (rawFilters.sort_by) params.sort_by = rawFilters.sort_by as string;
    if (rawFilters.sort_by) params.sort_by = rawFilters.sort_by;
    
    // Custom mappings for vote count and certification
    if (rawFilters.vote_count) params['vote_count.gte'] = rawFilters.vote_count;
    if (rawFilters.certification) {
      params.certification_country = 'US'; // Standard for most global content
      params.certification = rawFilters.certification;
    }
    
    // Mapping vote_average.gte directly if provided from UI
    if (rawFilters['vote_average.gte']) params['vote_average.gte'] = rawFilters['vote_average.gte'];

    if (rawFilters.runtime) {
      if (rawFilters.runtime === 'short') params['with_runtime.lte'] = '90';
      else if (rawFilters.runtime === 'medium') {
        params['with_runtime.gte'] = '90';
        params['with_runtime.lte'] = '150';
      } else if (rawFilters.runtime === 'long') params['with_runtime.gte'] = '150';
    }

    if (!isAISearch && activeGenre !== null) {
      params.with_genres = activeGenre.toString();
    }

    return params;
  }, [isAISearch, aiFilters, manualFilters, activeGenre]);

  const shouldDiscover = Object.keys(activeFilters).length > 0;
  
  const { data: discoveryResults = [], isLoading: isDiscoveryLoading } = useDiscoverMovies(activeFilters, shouldDiscover);

  const results = useMemo(() => {
    if (isAISearch) {
      if (aiFilters.query) return searchResults;
      if (shouldDiscover) return discoveryResults;
      return searchResults; // fallback if AI failed
    }
    if (shouldDiscover) return discoveryResults;
    if (activeGenre !== null) return genreResults;
    return searchResults;
  }, [shouldDiscover, discoveryResults, activeGenre, genreResults, searchResults, isAISearch, aiFilters]);

  const loading = isSearchLoading || isGenreLoading || isDiscoveryLoading || isAiLoading;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [results, popular]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.length >= 2) {
      setSearched(true);
      setActiveGenre(null);
    } else {
      setSearched(false);
    }
  }, []);

  const executeAISearch = async (overrideQuery?: string | any) => {
    const searchQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (searchQuery.length < 2) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAiLoading(true);
    setSearched(true);
    setActiveGenre(null);
    setIsAISearch(true);
    Keyboard.dismiss();

    try {
      const filters = await AIService.getSemanticFilters(searchQuery);
      setAiFilters(filters);
    } catch (error) {
      console.error("[useSearch] AI Search Failed:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleAIMode = () => {
    Haptics.selectionAsync();
    const newMode = !isAISearch;
    setIsAISearch(newMode);
    if (newMode) {
      setAiFilters({});
      setSearched(false);
    }
  };

  const handleGenrePress = (genreId: number | null) => {
    if (genreId === activeGenre) {
      setActiveGenre(null);
      setSearched(false);
      return;
    }

    setSearched(true);
    setActiveGenre(genreId);
    setQuery('');
    setIsAISearch(false);
  };

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearched(false);
    setActiveGenre(null);
    setAiFilters({});
    setManualFilters({});
    setIsAISearch(false);
    Keyboard.dismiss();
  }, []);

  const applyVoiceResults = useCallback((filters: Record<string, string>) => {
    setAiFilters(filters);
    setIsAISearch(true);
    setSearched(true);
    setActiveGenre(null);
    if (filters.query) {
      setQuery(filters.query);
    }
  }, []);

  const updateManualFilter = useCallback((key: string, value: string | null) => {
    setManualFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setSearched(true);
    setIsAISearch(false);
    setQuery('');
  }, []);

  const clearManualFilters = useCallback(() => {
    setManualFilters({
      genre: null,
      rating: null,
      language: null,
      runtime: null,
    });
    if (!query && activeGenre === null) {
      setSearched(false);
    }
  }, [query, activeGenre]);

  return {
    query,
    results,
    loading,
    searched,
    popular,
    activeGenre,
    isAISearch,
    setIsAISearch,
    scrollY,
    fadeAnim,
    isFocused,
    focusAnim,
    setIsFocused,
    handleSearch,
    executeAISearch,
    toggleAIMode,
    handleGenrePress,
    clearSearch,
    applyVoiceResults,
    manualFilters,
    updateManualFilter,
    clearManualFilters,
  };
};
