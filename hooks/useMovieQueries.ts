import { useQuery } from '@tanstack/react-query';
import * as tmdb from '@/lib/tmdb';

export const movieKeys = {
  all: ['movies'] as const,
  lists: () => [...movieKeys.all, 'list'] as const,
  list: (type: string) => [...movieKeys.lists(), type] as const,
  details: () => [...movieKeys.all, 'detail'] as const,
  detail: (id: number) => [...movieKeys.details(), id] as const,
  credits: (id: number) => [...movieKeys.detail(id), 'credits'] as const,
  videos: (id: number) => [...movieKeys.detail(id), 'videos'] as const,
  similar: (id: number) => [...movieKeys.detail(id), 'similar'] as const,
};

export function useNowPlaying() {
  return useQuery({
    queryKey: movieKeys.list('now_playing'),
    queryFn: tmdb.getNowPlaying,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function usePopular() {
  return useQuery({
    queryKey: movieKeys.list('popular'),
    queryFn: tmdb.getPopular,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useUpcoming() {
  return useQuery({
    queryKey: movieKeys.list('upcoming'),
    queryFn: tmdb.getUpcoming,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useTopRated() {
  return useQuery({
    queryKey: movieKeys.list('top_rated'),
    queryFn: tmdb.getTopRated,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: movieKeys.detail(id),
    queryFn: () => tmdb.getMovieDetails(id),
    enabled: !!id,
  });
}

export function useMovieCredits(id: number) {
  return useQuery({
    queryKey: movieKeys.credits(id),
    queryFn: () => tmdb.getMovieCredits(id),
    enabled: !!id,
  });
}

export function useMovieVideos(id: number) {
  return useQuery({
    queryKey: movieKeys.videos(id),
    queryFn: () => tmdb.getMovieVideos(id),
    enabled: !!id,
  });
}

export function useSimilarMovies(id: number) {
  return useQuery({
    queryKey: movieKeys.similar(id),
    queryFn: () => tmdb.getSimilarMovies(id),
    enabled: !!id,
  });
}

export function useSearchMovies(query: string, isAI: boolean = false) {
  return useQuery({
    queryKey: ['movies', 'search', query, isAI],
    queryFn: () => tmdb.searchMovies(query),
    enabled: query.length >= 2 && !isAI,
  });
}

export function useDiscoverMovies(params: Record<string, string>, enabled: boolean = true) {
  return useQuery({
    queryKey: ['movies', 'discover', params],
    queryFn: () => tmdb.discoverMovies(params),
    enabled: enabled && Object.keys(params).length > 0,
  });
}

export function useMoviesByGenre(genreId: number | null) {
  return useQuery({
    queryKey: ['movies', 'genre', genreId],
    queryFn: () => tmdb.getMoviesByGenre(genreId!),
    enabled: genreId !== null,
  });
}
