import { create } from 'zustand';
import { safeFetch } from './apiHelper';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

export interface IDebateMessage {
  _id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface DebateState {
  messages: IDebateMessage[];
  isLoading: boolean;
  isThinking: boolean;
  error: string | null;

  startSession: (movieId: number, movieTitle: string) => Promise<void>;
  sendMessage: (movieId: number, movieTitle: string, text: string) => Promise<boolean>;
  clearSession: () => void;
}

export const useDebateStore = create<DebateState>((set, get) => ({
  messages: [],
  isLoading: false,
  isThinking: false,
  error: null,

  startSession: async (movieId: number, movieTitle: string) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'עליך להתחבר כדי להשתתף בעימות AI', messages: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await safeFetch(`${API_BASE_URL}/debate/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId, movieTitle }),
      });

      if (response.success && response.data) {
        set({
          messages: response.data.chatHistory || [],
          isLoading: false,
        });
      } else {
        set({
          error: response.message || 'שגיאה באתחול העימות',
          isLoading: false,
          messages: [],
        });
      }
    } catch (err) {
      set({
        error: 'שגיאת תקשורת עם השרת',
        isLoading: false,
        messages: [],
      });
    }
  },

  sendMessage: async (movieId: number, movieTitle: string, text: string) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'פג תוקף החיבור שלך' });
      return false;
    }

    const optimisticUserMessage: IDebateMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update chat history in Zustand store
    set(state => ({
      messages: [...state.messages, optimisticUserMessage],
      isThinking: true,
      error: null,
    }));

    try {
      const response = await safeFetch(`${API_BASE_URL}/debate/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId, movieTitle, message: text }),
      });

      if (response.success && response.data) {
        set({
          messages: response.data.history || [],
          isThinking: false,
        });
        return true;
      } else {
        set({
          error: response.message || 'שגיאה בשליחת ההודעה ל-AI',
          isThinking: false,
        });
        return false;
      }
    } catch (err) {
      set({
        error: 'שגיאת תקשורת בשליחת הודעה',
        isThinking: false,
      });
      return false;
    }
  },

  clearSession: () => {
    set({ messages: [], isLoading: false, isThinking: false, error: null });
  },
}));

// Strict selectors for optimized React Native rendering
export const useDebateMessages = () => useDebateStore((state) => state.messages);
export const useDebateIsLoading = () => useDebateStore((state) => state.isLoading);
export const useDebateIsThinking = () => useDebateStore((state) => state.isThinking);
export const useDebateError = () => useDebateStore((state) => state.error);
export const useDebateActions = () => {
  const startSession = useDebateStore((state) => state.startSession);
  const sendMessage = useDebateStore((state) => state.sendMessage);
  const clearSession = useDebateStore((state) => state.clearSession);
  return { startSession, sendMessage, clearSession };
};
