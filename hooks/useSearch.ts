import { useState, useCallback, useEffect, useRef } from 'react';
import { Keyboard, Animated } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { searchMovies, getPopular, type TMDBMovie, getMoviesByGenre, discoverMovies } from '@/lib/tmdb';
import { AIService } from '@/services/AIService';

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [isAISearch, setIsAISearch] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Reanimated focus states
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused]);

  useEffect(() => {
    loadDiscovery();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [results, popular]);

  const loadDiscovery = async () => {
    try {
      const movies = await getPopular();
      setPopular(movies.slice(0, 6));
    } catch (e) {
      console.error('[useSearch] loadDiscovery failed:', e);
    }
  };

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    
    if (!isAISearch) {
      setLoading(true);
      setSearched(true);
      setActiveGenre(null);
      try {
        const movies = await searchMovies(text);
        setResults(movies);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
  }, [isAISearch]);

  const executeAISearch = async () => {
    if (query.length < 2) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setSearched(true);
    setActiveGenre(null);
    Keyboard.dismiss();

    try {
      const filters = await AIService.getSemanticFilters(query);
      const movies = await discoverMovies(filters);
      setResults(movies);
    } catch (error) {
      console.error("[useSearch] AI Search Failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAIMode = () => {
    Haptics.selectionAsync();
    const newMode = !isAISearch;
    setIsAISearch(newMode);
    if (newMode) {
      setResults([]);
      setSearched(false);
    }
  };

  const handleGenrePress = async (genreId: number | null) => {
    if (genreId === activeGenre) {
      setActiveGenre(null);
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    setActiveGenre(genreId);
    setQuery(''); 

    try {
      let movies;
      if (genreId === null) {
        movies = await getPopular();
      } else {
        movies = await getMoviesByGenre(genreId);
      }
      setResults(movies);
    } catch (e) {
      console.error('[useSearch] handleGenrePress failed:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setActiveGenre(null);
    Keyboard.dismiss();
  };

  return {
    query,
    results,
    loading,
    searched,
    popular,
    activeGenre,
    isAISearch,
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
  };
};
