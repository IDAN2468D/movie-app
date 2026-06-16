import { create } from 'zustand';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

export interface IEmotionNode {
  timestamp: string;
  sentimentScore: number;
  vibe: string;
  note?: string;
}

export interface IAggregatedNode {
  timeLabel: string;
  sentimentScore: number;
  vibe: string;
  density: number;
}

interface SynapseState {
  aggregatedTimeline: IAggregatedNode[];
  userTimeline: IEmotionNode[];
  isLoading: boolean;
  error: string | null;
  
  fetchSynapseData: (movieId: number) => Promise<void>;
  saveUserTimeline: (movieId: number, nodes: IEmotionNode[]) => Promise<{ success: boolean; message?: string }>;
}

export const useSynapseStore = create<SynapseState>((set) => ({
  aggregatedTimeline: [],
  userTimeline: [],
  isLoading: false,
  error: null,

  fetchSynapseData: async (movieId) => {
    set({ isLoading: true, error: null });
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await safeFetch(`${API_BASE_URL}/synapse/movie/${movieId}`, {
      method: 'GET',
      headers
    });

    if (response.success && response.data) {
      set({
        aggregatedTimeline: response.data.aggregatedTimeline || [],
        userTimeline: response.data.userTimeline || [],
        isLoading: false
      });
    } else {
      set({
        error: response.message || 'Failed to load emotional map',
        isLoading: false
      });
    }
  },

  saveUserTimeline: async (movieId, nodes) => {
    set({ isLoading: true });
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ isLoading: false });
      return { success: false, message: 'משתמש לא מחובר' };
    }

    const response = await safeFetch(`${API_BASE_URL}/synapse/movie/${movieId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ emotionNodes: nodes })
    });

    if (response.success) {
      set({
        userTimeline: response.data || nodes,
        isLoading: false
      });
      // Optionally refresh aggregated stats
      const store = useSynapseStore.getState();
      store.fetchSynapseData(movieId);
      return { success: true, message: response.message };
    } else {
      set({ isLoading: false });
      return { success: false, message: response.message || 'Failed to save emotional map' };
    }
  }
}));
