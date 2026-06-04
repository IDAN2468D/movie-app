/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';
import { TMDBMovie } from '../lib/tmdb';

export interface MovieTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  isDark: boolean;
}

const DEFAULT_THEME: MovieTheme = {
  primary: '#E50914', // CineBook Red
  secondary: '#9B1B30',
  accent: '#FFB84B',
  background: '#000000',
  isDark: true,
};

export const GENRE_THEMES: Record<number, Partial<MovieTheme>> = {
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

export const useMovieTheme = (movie: TMDBMovie | null): MovieTheme => {
  return useMemo(() => {
    if (!movie || !movie.genre_ids || movie.genre_ids.length === 0) {
      return DEFAULT_THEME;
    }

    const firstGenreId = movie.genre_ids[0];
    const genreTheme = GENRE_THEMES[firstGenreId];

    if (!genreTheme) return DEFAULT_THEME;

    return {
      ...DEFAULT_THEME,
      ...genreTheme,
    };
  }, [movie?.id, movie?.genre_ids]);
};
