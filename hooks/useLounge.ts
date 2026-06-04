/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { Audio } from '@/utils/safeExpoAv';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { AIService } from '@/services/AIService';

// Atmosphere Preset Moods
export interface MoodCapsule {
  id: string;
  label: string;
  emoji: string;
}

export const MOOD_CAPSULES: MoodCapsule[] = [
  { id: 'sci-fi', label: 'מד״ב עתידני', emoji: '🌌' },
  { id: 'suspense', label: 'מתח עוצר נשימה', emoji: '⏳' },
  { id: 'drama', label: 'דרמה מרגשת', emoji: '🎭' },
  { id: 'fantasy', label: 'פנטזיה אפית', emoji: '⚔️' },
  { id: 'horror', label: 'אימה בחלל', emoji: '💀' },
  { id: 'comedy', label: 'קומדיה קורעת', emoji: '😂' },
  { id: 'romance', label: 'הרפתקה רומנטית', emoji: '💖' },
];

// Soundtrack Audio Tracks
export interface SoundTrack {
  id: string;
  title: string;
  description: string;
  url: string;
}

export const SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'overture',
    title: 'פתיח דרמטי (Overture)',
    description: 'מנגינה תזמורתית עוצמתית המכניסה לאקשן סוחף',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'synths',
    title: 'סינתסייזר חללי (Spatial Synths)',
    description: 'צלילים אלקטרוניים עמוקים למסע בין כוכבים',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'ambience',
    title: 'רחש אולם קולנוע (Ambient Room)',
    description: 'אווירה סביבתית חמימה המדמה ישיבה באולם האפל',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
];

// SVG Sine Wave path generation worklet
const generateSinePath = (phaseVal: number, amplitude: number, frequency: number, baselineY: number) => {
  'worklet';
  const points = [];
  const step = 5;
  const pathWidth = 360;

  for (let x = 0; x <= pathWidth; x += step) {
    const y = baselineY + Math.sin(x * frequency + phaseVal) * amplitude;
    points.push(`${x},${y}`);
  }
  return `M ${points.join(' L ')}`;
};

export const useLounge = () => {
  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>('overture');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSurround, setIsSurround] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);

  // AI atmosphere generator state
  const [selectedMood, setSelectedMood] = useState<string>('sci-fi');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [narrativeText, setNarrativeText] = useState<string>('ברוכים הבאים לטרקלין הסאונד המרחבי של CineBook. עצמו עיניים והתכוננו לחוויה קולנועית יוצאת דופן...');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Reanimated Waveform shared values
  const phase = useSharedValue(0);
  const musicPlaying = useSharedValue(0);
  const aiSpeaking = useSharedValue(0);
  const isDucked = useSharedValue(0);

  // Keep tracks of sound loading to prevent race conditions
  const loadingTrackRef = useRef<string | null>(null);

  // Start sine wave phase animation
  useEffect(() => {
    phase.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Update animated variables on state changes
  useEffect(() => {
    musicPlaying.value = withTiming(isPlaying ? 1 : 0, { duration: 400 });
  }, [isPlaying]);

  useEffect(() => {
    aiSpeaking.value = withTiming(isSpeaking ? 1 : 0, { duration: 400 });
  }, [isSpeaking]);

  // Clean up sound and speech on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      Speech.stop();
    };
  }, [sound]);

  // Stop sound if tracking has changed
  const stopCurrentSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (err) {
        console.error("Error stopping sound:", err);
      }
      setSound(null);
      setIsPlaying(false);
    }
  };

  // Sound play/pause handler
  const togglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (sound) {
      try {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          const currentVolume = isSpeaking ? volume * 0.3 : volume;
          await sound.setVolumeAsync(currentVolume);
          await sound.playAsync();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error("Play/Pause sound error:", err);
      }
    } else {
      await loadAndPlayTrack(selectedTrack);
    }
  };

  // Load and play a specific soundtrack
  const loadAndPlayTrack = async (trackId: string) => {
    if (loadingTrackRef.current === trackId) return;
    loadingTrackRef.current = trackId;

    try {
      await stopCurrentSound();

      const track = SOUNDTRACKS.find(t => t.id === trackId);
      if (!track) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        {
          shouldPlay: true,
          isLooping: true,
          volume: isSpeaking ? volume * 0.3 : volume
        }
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error("Error loading track:", err);
    } finally {
      loadingTrackRef.current = null;
    }
  };

  // Track select handler
  const handleTrackChange = async (trackId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTrack(trackId);
    if (isPlaying || sound) {
      await loadAndPlayTrack(trackId);
    }
  };

  // Volume slider interaction simulation
  const handleVolumeAdjust = async (direction: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let nextVol = volume;
    if (direction === 'up') {
      nextVol = Math.min(volume + 0.1, 1.0);
    } else {
      nextVol = Math.max(volume - 0.1, 0.0);
    }
    setVolume(nextVol);
    if (sound) {
      const activeVolume = isSpeaking ? nextVol * 0.3 : nextVol;
      await sound.setVolumeAsync(activeVolume);
    }
  };

  // Surround simulation toggle
  const toggleSurround = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextSurround = !isSurround;
    setIsSurround(nextSurround);

    if (sound) {
      try {
        if (nextSurround) {
          await sound.setStatusAsync({
            rate: 1.0,
            shouldCorrectPitch: true,
          });
        } else {
          await sound.setStatusAsync({
            rate: 1.0,
          });
        }
      } catch (err) {
        console.error("Surround effect simulation error:", err);
      }
    }
  };

  // Audio narration with custom ducking orchestration
  const speakNarrative = async (textToSpeak: string) => {
    // 1. Duck background audio if playing
    if (sound && isPlaying) {
      isDucked.value = withTiming(1, { duration: 300 });
      await sound.setVolumeAsync(volume * 0.25);
    }

    setIsSpeaking(true);

    // 2. Play the cinematic voice using expo-speech in Hebrew
    Speech.speak(textToSpeak, {
      language: 'he-IL',
      rate: 0.82,
      pitch: 0.88,
      onStart: () => {
        setIsSpeaking(true);
      },
      onDone: () => {
        setIsSpeaking(false);
        if (sound && isPlaying) {
          isDucked.value = withTiming(0, { duration: 500 });
          sound.setVolumeAsync(volume).catch((err: any) => console.error("Error setting volume:", err));
        }
      },
      onStopped: () => {
        setIsSpeaking(false);
        if (sound && isPlaying) {
          isDucked.value = withTiming(0, { duration: 500 });
          sound.setVolumeAsync(volume).catch((err: any) => console.error("Error setting volume:", err));
        }
      },
      onError: (err) => {
        console.error("Speech narration error:", err);
        setIsSpeaking(false);
        if (sound && isPlaying) {
          isDucked.value = withTiming(0, { duration: 500 });
          sound.setVolumeAsync(volume).catch((e: any) => console.error("Error setting volume:", e));
        }
      }
    });
  };

  // AI Narrative Generator & Voice narration with ducking orchestration
  const generateAtmosphere = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsGenerating(true);

    // Stop any active narration
    Speech.stop();
    setIsSpeaking(false);

    try {
      const activeMoodObj = MOOD_CAPSULES.find(m => m.id === selectedMood);
      const moodLabel = activeMoodObj ? activeMoodObj.label : selectedMood;

      const generated = await AIService.generateAtmosphereNarrative(moodLabel, customPrompt);
      setNarrativeText(generated);

      // Begin Narration automatically
      speakNarrative(generated);
    } catch (err) {
      console.error("AI Generation failed:", err);
      setNarrativeText("משהו השתבש ביצירת האווירה, אך הטרקלין פתוח והסאונד מוכן!");
    } finally {
      setIsGenerating(false);
    }
  };

  // Wave 1: Primary Music Pink Wave
  const primaryWaveProps = useAnimatedProps(() => {
    const isMusicActive = musicPlaying.value > 0.1;
    const isDuckActive = isDucked.value > 0.1;
    let amp = 6;
    if (isMusicActive) {
      amp = isDuckActive ? 12 : 28;
    }
    const freq = isSurround ? 0.025 : 0.035;
    return {
      d: generateSinePath(phase.value, amp, freq, 80),
    };
  });

  // Wave 2: Cyan Ambient background rhythm
  const secondaryWaveProps = useAnimatedProps(() => {
    const isMusicActive = musicPlaying.value > 0.1;
    const amp = isMusicActive ? 18 : 8;
    const freq = isSurround ? 0.015 : 0.022;
    return {
      d: generateSinePath(-phase.value * 1.1 + 1.5, amp, freq, 85),
    };
  });

  // Wave 3: Glowing AI Yellow Narration Wave (highly reactive when speaking)
  const voiceWaveProps = useAnimatedProps(() => {
    const isSpeakingActive = aiSpeaking.value > 0.1;
    const amp = isSpeakingActive ? 36 : 2;
    return {
      d: generateSinePath(phase.value * 1.4, amp, 0.045, 75),
    };
  });

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return {
    // Audio state
    sound,
    selectedTrack,
    isPlaying,
    isSurround,
    volume,
    // AI state
    selectedMood,
    setSelectedMood,
    customPrompt,
    setCustomPrompt,
    narrativeText,
    isGenerating,
    isSpeaking,
    // Handlers
    togglePlay,
    handleTrackChange,
    handleVolumeAdjust,
    toggleSurround,
    generateAtmosphere,
    speakNarrative,
    goBack,
    // Animated props
    primaryWaveProps,
    secondaryWaveProps,
    voiceWaveProps,
  };
};
