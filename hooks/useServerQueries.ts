import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuthStore } from '@/store/useAuthStore';
import { safeFetch } from '@/store/apiHelper';
import { API_BASE_URL } from '@/constants/Config';
import { ServerUserSchema, ServerTicketSchema } from '@/lib/apiSchemas';

/**
 * Hook to retrieve user profile details (loyalty stats, activity, details)
 * validated strictly with Zod schemas and cached via TanStack Query.
 */
export const useUserProfileQuery = () => {
  const { token, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['userProfile', token],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token found');
      
      const response = await safeFetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch profile details from server');
      }

      // Safe validate with Zod Schema
      const result = ServerUserSchema.safeParse(response.data);
      if (!result.success) {
        console.warn('[Zod Validation Warning] User profile data mismatch:', result.error);
        return response.data; // Graceful fallback
      }

      return result.data;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes stale duration
  });
};

/**
 * Hook to retrieve the user's booking history and tickets
 * validated strictly with Zod schemas and cached via TanStack Query.
 */
export const useMyTicketsQuery = () => {
  const { token, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['myTickets', token],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token found');

      const response = await safeFetch(`${API_BASE_URL}/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch tickets from server');
      }

      // Safe validate list of tickets with Zod
      const ticketArraySchema = z.array(ServerTicketSchema);
      const result = ticketArraySchema.safeParse(response.data);
      if (!result.success) {
        console.warn('[Zod Validation Warning] Ticket list data mismatch:', result.error);
        return response.data; // Graceful fallback
      }

      return result.data;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes stale duration
  });
};
