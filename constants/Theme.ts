/**
 * CineBook Design Tokens
 * Premium dark-mode color palette and spacing system.
 */

export const Colors = {
  // Backgrounds
  background: '#09090B',
  surface: '#121214',
  surfaceLight: '#1E1E21',
  surfaceGlass: 'rgba(255, 255, 255, 0.05)',

  // YUV Branding
  primary: '#FF1464',       // YUV Pink/Red
  primaryLight: '#FF4785',
  secondary: '#E5FF00',     // YUV Neon Yellow
  secondaryDim: 'rgba(229, 255, 0, 0.15)',

  // Text
  text: '#FAFAF7',          // YUV Off-white
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',

  // Status
  success: '#E5FF00',       // Using secondary for success in YUV design
  error: '#FF1464',         // Using primary for error in YUV design
  warning: '#F59E0B',

  // Seat Map
  seatAvailable: '#27272A',
  seatSelected: '#E5FF00',
  seatTaken: '#121214',
  seatVIP: '#FF1464',
  white: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const Typography = {
  hero: { fontSize: 32, fontFamily: 'Anton-Regular', letterSpacing: -1.5, textAlign: 'right' as const, writingDirection: 'rtl' as const },
  h1: { fontSize: 26, fontFamily: 'Anton-Regular', letterSpacing: -1, textAlign: 'right' as const, writingDirection: 'rtl' as const },
  h2: { fontSize: 22, fontFamily: 'Rubik-Bold', letterSpacing: -0.5, textAlign: 'right' as const, writingDirection: 'rtl' as const },
  h3: { fontSize: 18, fontFamily: 'Rubik-Medium', textAlign: 'right' as const, writingDirection: 'rtl' as const },
  body: { fontSize: 15, fontFamily: 'Inter-Regular', lineHeight: 22, textAlign: 'right' as const, writingDirection: 'rtl' as const },
  caption: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 18, textAlign: 'right' as const, writingDirection: 'rtl' as const },
  label: { fontSize: 11, fontFamily: 'Inter-Medium', letterSpacing: 0.5, textAlign: 'right' as const, writingDirection: 'rtl' as const },
} as const;

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const POSTER_SIZES = {
  small: `${TMDB_IMAGE_BASE}/w342`,
  medium: `${TMDB_IMAGE_BASE}/w500`,
  large: `${TMDB_IMAGE_BASE}/w780`,
  original: `${TMDB_IMAGE_BASE}/original`,
};
export const BACKDROP_SIZES = {
  small: `${TMDB_IMAGE_BASE}/w780`,
  large: `${TMDB_IMAGE_BASE}/w1280`,
  original: `${TMDB_IMAGE_BASE}/original`,
};
