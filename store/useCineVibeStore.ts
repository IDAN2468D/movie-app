import { create } from 'zustand';

export type EmotionType = 'shock' | 'tears' | 'laughter' | 'hype';

export interface EmotionTimelineNode {
  minute: number;
  intensity: number;
  dominantEmotion: EmotionType;
}

interface CineVibeState {
  timeline: EmotionTimelineNode[];
  userReactions: Record<number, EmotionType>;
  addReaction: (minute: number, emotion: EmotionType) => void;
}

export const useCineVibeStore = create<CineVibeState>((set) => ({
  timeline: [
    { minute: 15, intensity: 45, dominantEmotion: 'laughter' },
    { minute: 45, intensity: 85, dominantEmotion: 'shock' },
    { minute: 75, intensity: 95, dominantEmotion: 'hype' },
    { minute: 110, intensity: 70, dominantEmotion: 'tears' },
  ],
  userReactions: {},
  addReaction: (minute, emotion) =>
    set((state) => ({
      userReactions: { ...state.userReactions, [minute]: emotion },
      timeline: state.timeline.map((node) =>
        node.minute === minute
          ? { ...node, intensity: Math.min(100, node.intensity + 5) }
          : node
      ),
    })),
}));
