import { create } from 'zustand';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

export interface IReview {
  _id: string;
  movieId: number;
  userId: string;
  userName: string;
  userProfileImage?: string;
  rating: number;
  content: string;
  isSpoiler: boolean;
  likes: string[]; // User IDs who liked it
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewState {
  reviews: IReview[];
  stats: ReviewStats | null;
  isLoading: boolean;
  error: string | null;

  fetchReviews: (movieId: number) => Promise<void>;
  addReview: (movieId: number, rating: number, content: string, isSpoiler: boolean) => Promise<{ success: boolean; message?: string }>;
  toggleLike: (reviewId: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<{ success: boolean; message?: string }>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchReviews: async (movieId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await safeFetch(`${API_BASE_URL}/reviews/movie/${movieId}`);
      if (response.success) {
        set({ 
          reviews: response.data || [], 
          stats: response.stats || null,
          isLoading: false 
        });
      } else {
        set({ error: response.message || 'שגיאה בטעינת ביקורות', isLoading: false });
      }
    } catch (err) {
      set({ error: 'שגיאת חיבור לשרת', isLoading: false });
    }
  },

  addReview: async (movieId: number, rating: number, content: string, isSpoiler: boolean) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      return { success: false, message: 'עליך להיות מחובר כדי לכתוב ביקורת' };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await safeFetch(`${API_BASE_URL}/reviews/movie/${movieId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, content, isSpoiler })
      });

      if (response.success) {
        // Refresh reviews list
        await get().fetchReviews(movieId);
        // Refresh user details (to update loyalty points & achievements in UI!)
        await useAuthStore.getState().checkAuth();
        return { success: true, message: response.message };
      } else {
        set({ isLoading: false });
        return { success: false, message: response.message || 'כתיבת ביקורת נכשלה' };
      }
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: 'שגיאת חיבור לשרת' };
    }
  },

  toggleLike: async (reviewId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const response = await safeFetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.success) {
        const currentUserId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
        if (!currentUserId) return;

        set(state => {
          const updatedReviews = state.reviews.map(review => {
            if (review._id === reviewId) {
              const updatedLikes = [...review.likes];
              const likeIndex = updatedLikes.indexOf(currentUserId);
              if (likeIndex > -1) {
                updatedLikes.splice(likeIndex, 1);
              } else {
                updatedLikes.push(currentUserId);
              }
              return { ...review, likes: updatedLikes };
            }
            return review;
          });
          return { reviews: updatedReviews };
        });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  },

  deleteReview: async (reviewId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      return { success: false, message: 'לא מורשה' };
    }

    try {
      const response = await safeFetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.success) {
        set(state => {
          const filteredReviews = state.reviews.filter(r => r._id !== reviewId);
          // Recalculate stats locally
          const total = filteredReviews.length;
          const average = total > 0 ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          filteredReviews.forEach(r => {
            const rating = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
            if (distribution[rating] !== undefined) {
              distribution[rating]++;
            }
          });
          return {
            reviews: filteredReviews,
            stats: total > 0 ? { total, average: parseFloat(average.toFixed(1)), distribution } : null
          };
        });
        return { success: true };
      } else {
        return { success: false, message: response.message || 'מחיקת ביקורת נכשלה' };
      }
    } catch (err) {
      return { success: false, message: 'שגיאת חיבור לשרת' };
    }
  }
}));
