import { create } from 'zustand';
import { AIService } from '@/services/AIService';

export interface TriviaQuestion {
  שאלה: string;
  אפשרויות: string[];
  תשובה_נכונה: number;
}

export interface ActingTraits {
  דרמה: number;
  כריזמה: number;
  גיוון: number;
  קומדיה: number;
}

export interface IconicRole {
  שם_הסרט: string;
  שם_הדמות: string;
  שנת_יציאה: string;
}

export interface ActorBiography {
  תקציר_ביוגרפי: string;
  חותם_אמנותי: string;
  טריוויה: string[];
  תכונות_משחק: ActingTraits;
  שאלון_טריוויה: TriviaQuestion[];
  תפקידים_אייקונים: IconicRole[];
}

interface ActorState {
  cache: Record<string, ActorBiography>;
  isLoading: boolean;
  error: string | null;
  
  activeQuestionIndex: number;
  chosenAnswers: Record<number, number>;
  score: number;
  
  fetchBiography: (actorName: string) => Promise<ActorBiography | null>;
  answerTrivia: (questionIndex: number, chosenOption: number, isCorrect: boolean) => void;
  resetTrivia: () => void;
}

export const useActorStore = create<ActorState>((set, get) => ({
  cache: {},
  isLoading: false,
  error: null,
  
  activeQuestionIndex: 0,
  chosenAnswers: {},
  score: 0,
  
  fetchBiography: async (actorName: string) => {
    set({ activeQuestionIndex: 0, chosenAnswers: {}, score: 0 });
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

  answerTrivia: (questionIndex, chosenOption, isCorrect) => {
    set((state) => {
      if (state.chosenAnswers[questionIndex] !== undefined) return state;
      return {
        chosenAnswers: { ...state.chosenAnswers, [questionIndex]: chosenOption },
        score: isCorrect ? state.score + 1 : state.score,
      };
    });
  },

  resetTrivia: () => {
    set({ activeQuestionIndex: 0, chosenAnswers: {}, score: 0 });
  }
}));
