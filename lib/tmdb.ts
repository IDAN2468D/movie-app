/**
 * TMDB API Client
 * Fetches movie data from TheMovieDB.
 */

const API_KEY = '01495650fdf4285e1dd890fb6717a935'; // Replace with your key or use env
const BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
  budget: number;
  revenue: number;
  status: string;
  production_companies: { id: number; name: string; logo_path: string | null }[];
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface TMDBCredits {
  cast: TMDBCast[];
}

const GENRE_MAP: Record<number, string> = {
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

async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'he-IL');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getNowPlaying(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/now_playing', { region: 'IL' });
  return data.results;
}

export async function getPopular(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/popular');
  return data.results;
}

export async function getUpcoming(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/upcoming', { region: 'IL' });
  return data.results;
}

export async function getTopRated(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/top_rated');
  return data.results;
}

export async function getMovieDetails(id: number): Promise<TMDBMovieDetails> {
  return fetchTMDB<TMDBMovieDetails>(`/movie/${id}`);
}

export async function getMovieCredits(id: number): Promise<TMDBCast[]> {
  const data = await fetchTMDB<TMDBCredits>(`/movie/${id}/credits`);
  return data.cast.slice(0, 10);
}

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<TMDBResponse<TMDBMovie>>('/search/movie', { query });
  return data.results;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export async function getMovieVideos(id: number): Promise<TMDBVideo[]> {
  const data = await fetchTMDB<{ results: TMDBVideo[] }>(`/movie/${id}/videos`);
  return data.results;
}

export async function getMoviesByGenre(genreId: number): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<TMDBResponse<TMDBMovie>>('/discover/movie', { with_genres: genreId.toString() });
  return data.results;
}
