import { Popcorn, Clapperboard, Star, Camera, Zap, Heart, Flame, Shield, Sparkles } from 'lucide-react-native';

export interface IMovieTheme {
  primaryColor: string;
  secondaryColor: string;
  genre: 'comedy' | 'action' | 'sci-fi' | 'horror' | 'drama';
  icons: any[];
}

export function getMovieTheme(title?: string): IMovieTheme {
  if (!title) {
    return {
      primaryColor: '#FF1464',
      secondaryColor: '#FFB300',
      genre: 'drama',
      icons: [Heart, Star, Popcorn]
    };
  }

  const t = title.toLowerCase();
  if (t.includes('מואנה') || t.includes('moana') || t.includes('comedy') || t.includes('אנימציה') || t.includes('קומדיה') || t.includes('צעצוע')) {
    return {
      primaryColor: '#FFE500', // Neon Yellow
      secondaryColor: '#00E5FF', // Electric Blue
      genre: 'comedy',
      icons: [Popcorn, Sparkles, Star]
    };
  } else if (t.includes('דדפול') || t.includes('deadpool') || t.includes('גלדיאטור') || t.includes('gladiator') || t.includes('אקשן') || t.includes('action') || t.includes('מהיר')) {
    return {
      primaryColor: '#FF1464', // Neon Crimson
      secondaryColor: '#FF8A00', // Orange Glow
      genre: 'action',
      icons: [Flame, Shield, Zap]
    };
  } else if (t.includes('רשע') || t.includes('wicked') || t.includes('מכשפה') || t.includes('ספיידרמן') || t.includes('מלחמת')) {
    return {
      primaryColor: '#D500F9', // Deep Purple
      secondaryColor: '#00E676', // Witch Green
      genre: 'sci-fi',
      icons: [Sparkles, Star, Clapperboard]
    };
  } else if (t.includes('אימה') || t.includes('horror') || t.includes('מתח') || t.includes('thriller') || t.includes('צעקה')) {
    return {
      primaryColor: '#900C3F', // Crimson
      secondaryColor: '#1A1A1D', // Dark Slate
      genre: 'horror',
      icons: [Camera, Star, Clapperboard]
    };
  } else {
    // Default Drama/Rose theme
    return {
      primaryColor: '#FF1464', // Rose Pink
      secondaryColor: '#FFB300', // Gold Accent
      genre: 'drama',
      icons: [Heart, Star, Popcorn]
    };
  }
}
