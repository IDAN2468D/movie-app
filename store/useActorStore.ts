import { create } from 'zustand';
import { AIService } from '@/services/AIService';

export interface ActorBiography {
  תקציר_ביוגרפי: string;
  חותם_אמנותי: string;
  טריוויה: string[];
}

interface ActorState {
  cache: Record<string, ActorBiography>;
  isLoading: boolean;
  error: string | null;
  fetchBiography: (actorName: string) => Promise<ActorBiography | null>;
}

export const useActorStore = create<ActorState>((set, get) => ({
  cache: {},
  isLoading: false,
  error: null,
  
  fetchBiography: async (actorName: string) => {
    const { cache } = get();
    
    // Return cached biography if it exists
    if (cache[actorName]) {
      return cache[actorName];
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const biography = await AIService.generateActorBiography(actorName);
      set((state) => ({
        cache: { ...state.cache, [actorName]: biography },
        isLoading: false,
      }));
      return biography;
    } catch (error: any) {
      console.error('[useActorStore] Error fetching biography:', error);
      set({ error: error.message || 'שגיאה בטעינת הביוגרפיה', isLoading: false });
      return null;
    }
  },
}));
