/**
 * TMDB API Client
 * Fetches movie data from TheMovieDB.
 */

import { z } from 'zod';
import { 
  MovieResponseSchema,
  MovieDetailsSchema,
  CastResponseSchema,
  VideoResponseSchema,
  type Movie,
  type MovieDetails,
  type Cast,
  type Video
} from './apiSchemas';

export { 
  type Movie, 
  type MovieDetails, 
  type Cast, 
  type Video,
  type Movie as TMDBMovie,
  type MovieDetails as TMDBMovieDetails,
  type Cast as TMDBCast,
  type Video as TMDBVideo,
};

const API_KEY = '01495650fdf4285e1dd890fb6717a935'; // Replace with your key or use env
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTMDB<T>(
  endpoint: string, 
  schema: z.ZodSchema<T>, 
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'he-IL');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB Error: ${response.status} ${response.statusText}`);
  }
  
  const json = await response.json();
  const result = schema.safeParse(json);
  
  if (!result.success) {
    console.error(`Zod Validation Error for ${endpoint}:`, result.error);
    // Return the json anyway if it's mostly correct, but log it. 
    // In strict production, we might throw here.
    return json as T; 
  }
  
  return result.data;
}

export async function getNowPlaying(): Promise<Movie[]> {
  const data = await fetchTMDB('/movie/now_playing', MovieResponseSchema, { region: 'IL' });
  return data.results;
}

export async function getPopular(): Promise<Movie[]> {
  const data = await fetchTMDB('/movie/popular', MovieResponseSchema);
  return data.results;
}

export async function getUpcoming(): Promise<Movie[]> {
  const data = await fetchTMDB('/movie/upcoming', MovieResponseSchema, { region: 'IL' });
  return data.results;
}

export async function getTopRated(): Promise<Movie[]> {
  const data = await fetchTMDB('/movie/top_rated', MovieResponseSchema);
  return data.results;
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  return fetchTMDB(`/movie/${id}`, MovieDetailsSchema);
}

export const GENRE_MAP: Record<number, string> = {
  28: 'אקשן',
  12: 'הרפתקאות',
  16: 'אנימציה',
  35: 'קומדיה',
  80: 'פשע',
  99: 'דוקומנטרי',
  18: 'דרמה',
  10751: 'משפחה',
  14: 'פנטזיה',
  36: 'היסטוריה',
  27: 'אימה',
  10402: 'מוזיקה',
  9648: 'מסתורין',
  10749: 'רומנטיקה',
  878: 'מדע בדיוני',
  53: 'מתח',
  10752: 'מלחמה',
  37: 'מערבון',
};

export function getGenreName(id: number): string {
  return GENRE_MAP[id] || 'כללי';
}

export async function getMovieCredits(id: number): Promise<Cast[]> {
  const data = await fetchTMDB(`/movie/${id}/credits`, CastResponseSchema);
  return data.cast.slice(0, 10);
}



export async function searchMovies(query: string): Promise<Movie[]> {
  const data = await fetchTMDB('/search/movie', MovieResponseSchema, { query });
  return data.results;
}

export async function getMovieVideos(id: number): Promise<Video[]> {
  try {
    const data = await fetchTMDB(`/movie/${id}/videos`, VideoResponseSchema);
    if (data.results.length === 0) {
      // Fallback to English if no Hebrew results
      const engData = await fetchTMDB(`/movie/${id}/videos`, VideoResponseSchema, { language: 'en-US' });
      return engData.results;
    }
    return data.results;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
}

export async function getMoviesByGenre(genreId: number): Promise<Movie[]> {
  const data = await fetchTMDB('/discover/movie', MovieResponseSchema, { with_genres: genreId.toString() });
  return data.results;
}

export async function discoverMovies(params: Record<string, string>): Promise<Movie[]> {
  const data = await fetchTMDB('/discover/movie', MovieResponseSchema, params);
  return data.results;
}

export async function getSimilarMovies(movieId: number): Promise<Movie[]> {
  const data = await fetchTMDB(`/movie/${movieId}/similar`, MovieResponseSchema);
  return data.results;
}

