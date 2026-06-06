/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { TMDBMovie } from '../lib/tmdb';
import { AIService } from '../services/AIService';

export interface BaseTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  isDark: boolean;
  blurIntensity: number;
  glassOpacity: number;
  animationSpeed: number;
  moodNarrative: string;
}

export interface MovieTheme extends BaseTheme {
  primaryShared: SharedValue<string>;
  secondaryShared: SharedValue<string>;
  accentShared: SharedValue<string>;
  glassOpacityShared: SharedValue<number>;
  blurIntensityShared: SharedValue<number>;
}

const DEFAULT_THEME: BaseTheme = {
  primary: '#E50914', // CineBook Red
  secondary: '#9B1B30',
  accent: '#FFB84B',
  background: '#000000',
  isDark: true,
  blurIntensity: 60,
  glassOpacity: 0.15,
  animationSpeed: 1500,
  moodNarrative: '',
};

export const GENRE_THEMES: Record<number, Partial<BaseTheme>> = {
  28: { primary: '#FF4B4B', secondary: '#8B0000', accent: '#FFD700' }, // Action
  12: { primary: '#4BFFB8', secondary: '#006400', accent: '#DAA520' }, // Adventure
  16: { primary: '#FF4B9E', secondary: '#C71585', accent: '#00BFFF' }, // Animation
  35: { primary: '#FFD700', secondary: '#FF8C00', accent: '#4B9EFF' }, // Comedy
  80: { primary: '#4B4B4B', secondary: '#1A1A1A', accent: '#FF4B4B' }, // Crime
  18: { primary: '#B8860B', secondary: '#556B2F', accent: '#E6E6FA' }, // Drama
  10751: { primary: '#7FFFD4', secondary: '#4682B4', accent: '#FF69B4' }, // Family
  14: { primary: '#9370DB', secondary: '#4B0082', accent: '#7FFFD4' }, // Fantasy
  27: { primary: '#800000', secondary: '#000000', accent: '#FFFFFF' }, // Horror
  878: { primary: '#00FFFF', secondary: '#191970', accent: '#9370DB' }, // Sci-Fi
  53: { primary: '#FF4500', secondary: '#2F4F4F', accent: '#F0E68C' }, // Thriller
};

// Global in-memory cache for movie themes
const dnaCache = new Map<number, BaseTheme>();

export const useMovieTheme = (movie: TMDBMovie | null): MovieTheme => {
  // Shared values for high-performance animation
  const primaryShared = useSharedValue(DEFAULT_THEME.primary);
  const secondaryShared = useSharedValue(DEFAULT_THEME.secondary);
  const accentShared = useSharedValue(DEFAULT_THEME.accent);
  const glassOpacityShared = useSharedValue(DEFAULT_THEME.glassOpacity);
  const blurIntensityShared = useSharedValue(DEFAULT_THEME.blurIntensity);

  const [themeState, setThemeState] = useState<BaseTheme>(() => {
    if (!movie || !movie.genre_ids || movie.genre_ids.length === 0) {
      return DEFAULT_THEME;
    }
    const firstGenreId = movie.genre_ids[0];
    const genreTheme = GENRE_THEMES[firstGenreId];
    return {
      ...DEFAULT_THEME,
      ...genreTheme,
    };
  });

  useEffect(() => {
    if (!movie) {
      setThemeState(DEFAULT_THEME);
      return;
    }

    const movieId = movie.id;
    const firstGenreId = movie.genre_ids?.[0] || 0;
    const staticTheme: BaseTheme = {
      ...DEFAULT_THEME,
      ...GENRE_THEMES[firstGenreId],
    };

    if (dnaCache.has(movieId)) {
      setThemeState(dnaCache.get(movieId)!);
      return;
    }

    // Set fallback static theme initially to prevent layout flashing
    setThemeState(staticTheme);

    let isMounted = true;

    AIService.getMovieVisualDNA(movie.title, movie.overview || '')
      .then((dna) => {
        if (!isMounted) return;

        const fullTheme: BaseTheme = {
          primary: dna.primary,
          secondary: dna.secondary,
          accent: dna.accent,
          background: DEFAULT_THEME.background,
          isDark: DEFAULT_THEME.isDark,
          blurIntensity: dna.blurIntensity,
          glassOpacity: dna.glassOpacity,
          animationSpeed: dna.animationSpeed,
          moodNarrative: dna.moodNarrative,
        };

        dnaCache.set(movieId, fullTheme);
        setThemeState(fullTheme);
      })
      .catch((err) => {
        console.warn('Failed to load AI theme, falling back to static genre', err);
      });

    return () => {
      isMounted = false;
    };
  }, [movie?.id]);

  useEffect(() => {
    const duration = themeState.animationSpeed;
    primaryShared.value = withTiming(themeState.primary, { duration });
    secondaryShared.value = withTiming(themeState.secondary, { duration });
    accentShared.value = withTiming(themeState.accent, { duration });
    glassOpacityShared.value = withTiming(themeState.glassOpacity, { duration });
    blurIntensityShared.value = withTiming(themeState.blurIntensity, { duration });
  }, [themeState]);

  return {
    ...themeState,
    primaryShared,
    secondaryShared,
    accentShared,
    glassOpacityShared,
    blurIntensityShared,
  };
};

