import { ImageSourcePropType } from 'react-native';
import { POSTER_SIZES, BACKDROP_SIZES } from '../constants/Theme';

/**
 * Image Utilities for CineBook
 * Centralizes TMDB image URI generation and fallback logic.
 */

export const FALLBACK_POSTER = require('../assets/images/poster-placeholder.png');
export const FALLBACK_BACKDROP = require('../assets/images/cinema_background.jpg');
export const FALLBACK_AVATAR = require('../assets/images/default-avatar.png');

export type ImageType = 'poster' | 'backdrop' | 'profile';
export type ImageSize = 'small' | 'medium' | 'large' | 'original';

/**
 * Generates a safe TMDB image source or returns a fallback asset
 */
export const getImageSource = (
  path: string | null | undefined,
  type: ImageType = 'poster',
  size: ImageSize = 'medium'
): ImageSourcePropType => {
  if (!path) {
    return getFallback(type);
  }

  // If path is an absolute HTTP/HTTPS URL, return it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return { uri: path };
  }

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  let baseUrl = '';
  if (type === 'poster') {
    baseUrl = POSTER_SIZES[size as keyof typeof POSTER_SIZES] || POSTER_SIZES.medium;
  } else if (type === 'backdrop') {
    baseUrl = BACKDROP_SIZES[size === 'small' ? 'small' : 'large'] || BACKDROP_SIZES.large;
  } else {
    // For profile images, we'll use small poster size as default
    baseUrl = POSTER_SIZES.small;
  }

  return { uri: `${baseUrl}${cleanPath}` };
};

/**
 * Returns the appropriate fallback asset for the image type
 */
const getFallback = (type: ImageType): ImageSourcePropType => {
  switch (type) {
    case 'backdrop':
      return FALLBACK_BACKDROP;
    case 'profile':
      return FALLBACK_AVATAR;
    case 'poster':
    default:
      return FALLBACK_POSTER;
  }
};

/**
 * Higher-order helper for handling image load errors at the component level
 */
export const handleImageError = (
  setSource: (source: ImageSourcePropType) => void,
  type: ImageType = 'poster'
) => {
  return () => {
    setSource(getFallback(type));
  };
};
