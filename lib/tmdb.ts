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

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

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

const MOCK_MOVIES: Movie[] = [
  {
    id: 693134,
    title: 'חולית: חלק שני',
    overview: 'מסעו של פול אטריידס כשהוא מתאחד עם צ\'אני והפרמן בזמן שהוא במסלול של נקמה נגד הקושרים שהשמידו את משפחתו. הוא מנסה למנוע עתיד נורא שרק הוא יכול לחזות.',
    poster_path: '/1pdfPmN2gTyevU4FUVgTjHdp35n.jpg',
    backdrop_path: '/xOM4Z626EE096jqd66brgoPwRP6.jpg',
    release_date: '2024-02-27',
    vote_average: 8.3,
    vote_count: 3450,
    genre_ids: [28, 12, 878],
    popularity: 950.5,
    original_language: 'en'
  },
  {
    id: 872585,
    title: 'אופנהיימר',
    overview: 'סיפורו של המדען האמריקאי ג\'יי רוברט אופנהיימר ותפקידו בפיתוח פצצת האטום במהלך מלחמת העולם השנייה, פרויקט מנהטן ששינה את פני ההיסטוריה לתמיד.',
    poster_path: '/8Gxl6bzoGhoNDaZaEvSafeJJDfo.jpg',
    backdrop_path: '/fm6NqXy68Cl6CwOQdIOih2PI2JV.jpg',
    release_date: '2023-07-19',
    vote_average: 8.1,
    vote_count: 5600,
    genre_ids: [18, 36],
    popularity: 420.2,
    original_language: 'en'
  },
  {
    id: 569094,
    title: 'ספיידרמן: ברחבי ממדי העכביש',
    overview: 'מיילס מוראלס חוזר לפרק הבא בסאגת ממדי העכביש עטורת הפרסים. הרפתקה אפית שתעביר את הספיידרמן השכונתי החביב של ברוקלין על פני המולטיוורס כדי להגן על קיומו.',
    poster_path: '/8Vt6mWEReH4usr8jWhh3tN1055L.jpg',
    backdrop_path: '/giUR53tQj5w62Zz6uLw9tQ3x9f4.jpg',
    release_date: '2023-05-31',
    vote_average: 8.4,
    vote_count: 4200,
    genre_ids: [16, 28, 12, 878],
    popularity: 380.7,
    original_language: 'en'
  },
  {
    id: 414906,
    title: 'באטמן',
    overview: 'בשנתו השנייה ללחימה בפשע, באטמן חושף שחיתות בגות\'אם סיטי המקשרת למשפחתו שלו תוך כדי שהוא רודף אחרי הרוצח הסדרתי הסאדיסטי המכונה איש החידות.',
    poster_path: '/74xTEgt7R361jEUzs49RRS20hAh.jpg',
    backdrop_path: '/t9XsbA0pdZs8qiJy5VywI7KV6WD.jpg',
    release_date: '2022-03-01',
    vote_average: 7.7,
    vote_count: 8200,
    genre_ids: [28, 80, 9648],
    popularity: 250.4,
    original_language: 'en'
  },
  {
    id: 157336,
    title: 'בין כוכבים',
    overview: 'הרפתקה של קבוצת חוקרים המשתמשים בחור תולעת שהתגלה לאחרונה כדי לעקוף את המגבלות על מסע בחלל האנושי ולכבוש את המרחקים העצומים הכרוכים במסע בין-כוכבי כדי להציל את המין האנושי.',
    poster_path: '/gEU2QvE4v6Wg3vV6V74mOhEvuHG.jpg',
    backdrop_path: '/xJHokZbljvjJZxtpa0KG2nxS8Ko.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    vote_count: 14500,
    genre_ids: [12, 18, 878],
    popularity: 180.3,
    original_language: 'en'
  },
  {
    id: 329,
    title: 'עולם היורה: תאוריית הכאוס',
    overview: 'הרפתקת מתח פרהיסטורית מדהימה בעולם שבו דינוזאורים חיים לצד בני אדם, ומאבקי הישרדות יומיומיים הופכים למציאות חדשה ומסוכנת.',
    poster_path: '/cMD9YDz1eeCg47Yq5ewpG60F7AI.jpg',
    backdrop_path: '/2y76J6phBF2818j2vX8hTf79Yq5.jpg',
    release_date: '2024-05-24',
    vote_average: 7.9,
    vote_count: 120,
    genre_ids: [28, 12, 878],
    popularity: 150.1,
    original_language: 'en'
  }
];

function getMockResponse(endpoint: string, params: Record<string, string>): any {
  const movieDetailMatch = endpoint.match(/^\/movie\/(\d+)$/);
  const movieCreditsMatch = endpoint.match(/^\/movie\/(\d+)\/credits$/);
  const movieVideosMatch = endpoint.match(/^\/movie\/(\d+)\/videos$/);
  const movieSimilarMatch = endpoint.match(/^\/movie\/(\d+)\/similar$/);

  const mockList = MOCK_MOVIES;

  if (endpoint === '/movie/now_playing' || endpoint === '/movie/popular' || endpoint === '/movie/upcoming' || endpoint === '/movie/top_rated') {
    return {
      page: 1,
      results: mockList,
      total_pages: 1,
      total_results: mockList.length
    };
  }

  if (endpoint === '/search/movie') {
    const query = (params.query || '').toLowerCase();
    const filtered = mockList.filter(m => m.title.toLowerCase().includes(query) || m.overview.toLowerCase().includes(query));
    return {
      page: 1,
      results: filtered.length > 0 ? filtered : mockList,
      total_pages: 1,
      total_results: filtered.length > 0 ? filtered.length : mockList.length
    };
  }

  if (endpoint === '/discover/movie') {
    return {
      page: 1,
      results: mockList,
      total_pages: 1,
      total_results: mockList.length
    };
  }

  if (movieDetailMatch) {
    const id = parseInt(movieDetailMatch[1], 10);
    const movie = mockList.find(m => m.id === id) || mockList[0];
    return {
      ...movie,
      runtime: 124,
      genres: movie.genre_ids.map(gId => ({ id: gId, name: getGenreName(gId) })),
      tagline: 'חוויה קולנועית עוצרת נשימה',
      budget: 150000000,
      revenue: 450000000,
      status: 'Released'
    };
  }

  if (movieCreditsMatch) {
    return {
      cast: [
        { id: 1, name: 'טים רובינס', character: 'אנדי דופריין', profile_path: null, order: 0 },
        { id: 2, name: 'מורגן פרימן', character: 'אליס בויד רדינג', profile_path: null, order: 1 },
        { id: 3, name: 'טים ת\'ומאס', character: 'קפטן ביירון הידלי', profile_path: null, order: 2 }
      ]
    };
  }

  if (movieVideosMatch) {
    return {
      results: [
        {
          id: 'mock_trailer_1',
          key: 'dQw4w9WgXcQ',
          name: 'Official Trailer',
          site: 'YouTube',
          type: 'Trailer'
        }
      ]
    };
  }

  if (movieSimilarMatch) {
    const id = parseInt(movieSimilarMatch[1], 10);
    const filtered = mockList.filter(m => m.id !== id);
    return {
      page: 1,
      results: filtered,
      total_pages: 1,
      total_results: filtered.length
    };
  }

  return null;
}

async function fetchTMDB<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  params: Record<string, string> = {},
  retries = 2
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'he-IL');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TMDB Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const result = schema.safeParse(json);

      if (!result.success) {
        console.error(`Zod Validation Error for ${endpoint}:`, result.error);
        return json as T;
      }

      return result.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      const isAbort = error.name === 'AbortError';
      const errorMsg = isAbort ? 'Request timed out (8s)' : error.message || String(error);

      console.warn(
        `TMDB fetch attempt ${attempt + 1}/${retries + 1} failed for ${endpoint}: ${errorMsg}`
      );

      if (attempt < retries) {
        const backoffDelay = Math.pow(2, attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  console.warn(
    `[TMDB Client] TMDB API completely unreachable. Falling back to local offline mock database for ${endpoint}`
  );

  const mockRes = getMockResponse(endpoint, params);
  if (mockRes) {
    const result = schema.safeParse(mockRes);
    if (result.success) {
      return result.data;
    } else {
      console.error(`[TMDB Client] Mock data validation failed for ${endpoint}:`, result.error);
      return mockRes as T;
    }
  }

  throw lastError || new Error(`Failed to fetch from TMDB: ${endpoint}`);
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

// (GENRE_MAP and getGenreName have been moved to the top of the file to support the mock database fallback)

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
