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
  official: z.boolean().optional(),
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

/**
 * Server User Schemas
 */
export const ServerPaymentMethodSchema = z.object({
  id: z.string(),
  last4: z.string(),
  brand: z.string(),
  expiryDate: z.string(),
  holderName: z.string(),
});

export const ServerLoyaltyActivitySchema = z.object({
  action: z.string(),
  points: z.string(),
  date: z.string().or(z.date()),
});

export const ServerUserSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  name: z.string(),
  email: z.string(),
  profileImage: z.string().optional(),
  watchlist: z.array(z.number()).optional().default([]),
  paymentMethods: z.array(ServerPaymentMethodSchema).optional().default([]),
  loyaltyPoints: z.number().default(0),
  loyaltyTrophies: z.array(z.string()).optional().default([]),
  loyaltyActivity: z.array(ServerLoyaltyActivitySchema).optional().default([]),
});

/**
 * Server Ticket Schemas
 */
export const ServerShowtimeSchema = z.object({
  time: z.string(),
  format: z.string(),
  price: z.number(),
  hall: z.string(),
});

export const ServerSeatSchema = z.object({
  row: z.string(),
  number: z.number(),
  type: z.string(),
});

export const ServerSnackItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image: z.any().optional(),
  customization: z.object({
    butterLevel: z.number().optional(),
    flavors: z.array(z.string()).optional(),
    toppings: z.array(z.string()).optional(),
  }).optional(),
});

export const ServerTicketSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  movieId: z.number(),
  movieTitle: z.string(),
  moviePoster: z.string().optional(),
  date: z.string(),
  showtime: ServerShowtimeSchema,
  seats: z.array(ServerSeatSchema),
  snacks: z.array(ServerSnackItemSchema).optional().default([]),
  totalPrice: z.number(),
  bookingDate: z.string().or(z.date()).optional(),
});

/**
 * Generic Server Response Schema
 */
export const ServerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export type ServerUser = z.infer<typeof ServerUserSchema>;
export type ServerTicket = z.infer<typeof ServerTicketSchema>;
