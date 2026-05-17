import { z } from 'zod';

/**
 * Base Movie Schema
 */
export const MovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().optional().default(''),
  vote_average: z.number(),
  vote_count: z.number(),
  genre_ids: z.array(z.number()).optional().default([]),
  popularity: z.number().optional(),
  original_language: z.string().optional(),
});

/**
 * Detailed Movie Schema
 */
export const MovieDetailsSchema = MovieSchema.extend({
  runtime: z.number().optional().default(0),
  genres: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).optional().default([]),
  tagline: z.string().optional().default(''),
  budget: z.number().optional(),
  revenue: z.number().optional(),
  status: z.string().optional(),
});

/**
 * Cast Member Schema
 */
export const CastSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string(),
  profile_path: z.string().nullable(),
  order: z.number(),
});

/**
 * Video Schema
 */
export const VideoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  site: z.string(),
  type: z.string(),
});

/**
 * API Response Wrappers
 */
export const MovieResponseSchema = z.object({
  page: z.number(),
  results: z.array(MovieSchema),
  total_pages: z.number(),
  total_results: z.number(),
});

export const CastResponseSchema = z.object({
  cast: z.array(CastSchema),
});

export const VideoResponseSchema = z.object({
  results: z.array(VideoSchema),
});

export type Movie = z.infer<typeof MovieSchema>;
export type MovieDetails = z.infer<typeof MovieDetailsSchema>;
export type Cast = z.infer<typeof CastSchema>;
export type Video = z.infer<typeof VideoSchema>;
