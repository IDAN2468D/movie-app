import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { AIService } from '@/services/AIService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Atmosphere Preset Moods
interface MoodCapsule {
  id: string;
  label: string;
  emoji: string;
}

const MOOD_CAPSULES: MoodCapsule[] = [
  { id: 'sci-fi', label: 'מד״ב עתידני', emoji: '🌌' },
  { id: 'suspense', label: 'מתח עוצר נשימה', emoji: '⏳' },
  { id: 'drama', label: 'דרמה מרגשת', emoji: '🎭' },
  { id: 'fantasy', label: 'פנטזיה אפית', emoji: '⚔️' },
  { id: 'horror', label: 'אימה בחלל', emoji: '💀' },
  { id: 'comedy', label: 'קומדיה קורעת', emoji: '😂' },
  { id: 'romance', label: 'הרפתקה רומנטית', emoji: '💖' },
];

// Soundtrack Audio Tracks
interface SoundTrack {
  id: string;
  title: string;
  description: string;
  url: string;
}

const SOUNDTRACKS: SoundTrack[] = [
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

export default function LoungeScreen() {
  const insets = useSafeAreaInsets();

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
  const musicPlaying = useSharedValue(0); // 0 or 1
  const aiSpeaking = useSharedValue(0); // 0 or 1
  const isDucked = useSharedValue(0); // 0 or 1

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
          // Keep ducking state synced
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
        // Spatial Audio simulation: pan left/right or adjust volumes/rates
        if (nextSurround) {
          // Slight stereo separation simulation
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
      rate: 0.82,  // slow, mysterious cinematic narration rate
      pitch: 0.88, // slightly deep, premium voice
      onStart: () => {
        setIsSpeaking(true);
      },
      onDone: () => {
        setIsSpeaking(false);
        // 3. Smoothly swell background audio back to normal volume
        if (sound && isPlaying) {
          isDucked.value = withTiming(0, { duration: 500 });
          sound.setVolumeAsync(volume).catch(err => console.error("Error setting volume:", err));
        }
      },
      onStopped: () => {
        setIsSpeaking(false);
        if (sound && isPlaying) {
          isDucked.value = withTiming(0, { duration: 500 });
          sound.setVolumeAsync(volume).catch(err => console.error("Error setting volume:", err));
        }
      },
      onError: (err) => {
        console.error("Speech narration error:", err);
        setIsSpeaking(false);
        if (sound && isPlaying) {
          isDucked.value = withTiming(0, { duration: 500 });
          sound.setVolumeAsync(volume).catch(e => console.error("Error setting volume:", e));
        }
      }
    });
  };

  // SVG Sine Wave path generation worklets
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

  // Wave 1: Primary Music Pink Wave
  const primaryWaveProps = useAnimatedProps(() => {
    const isMusicActive = musicPlaying.value > 0.1;
    const isDuckActive = isDucked.value > 0.1;
    let amp = 6;
    if (isMusicActive) {
      amp = isDuckActive ? 12 : 28;
    }
    // Add surround stereoscopic wave jitter
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

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      {/* Premium Cinematic Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#0F0A1A', '#06040A', '#000000']}
          style={StyleSheet.absoluteFill}
        />
        {/* Neon Light Spheres (Ambient Glows) */}
        <View style={[styles.glowSphere, { top: '10%', right: '-20%', backgroundColor: Colors.primary, opacity: 0.12 }]} />
        <View style={[styles.glowSphere, { bottom: '25%', left: '-30%', backgroundColor: '#06B6D4', opacity: 0.1 }]} />
      </View>

      {/* Screen Header - Custom LTR Row Flow */}
      <View className="flex-row-reverse items-center justify-between px-6 pt-4 mb-4" style={{ marginTop: insets.top }}>
        <Pressable
          testID="back-button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="w-10 h-10 rounded-full border border-white/10 items-center justify-center bg-black/35"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </Pressable>
        <Text className="text-white text-xl font-bold font-assistant text-left" style={{ writingDirection: 'ltr' }}>
          🎧 טרקלין סאונד מרחבי
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
      >
        {/* Glass Visualizer Screen Box */}
        <View className="rounded-3xl border border-white/10 overflow-hidden bg-surfaceLight/30 mb-6">
          <BlurView intensity={25} tint="dark" className="p-6">
            <View className="items-center justify-center h-44 mb-4">
              {/* Neon Glow Visualizer Waves */}
              <Svg width="100%" height="160" viewBox="0 0 360 160" fill="none">
                <Defs>
                  <SvgGradient id="pinkGlow" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.8" />
                    <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  </SvgGradient>
                  <SvgGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
                    <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
                  </SvgGradient>
                  <SvgGradient id="yellowGlow" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={Colors.secondary} stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
                  </SvgGradient>
                </Defs>

                {/* Overlapping glowing wave paths */}
                <AnimatedPath
                  animatedProps={secondaryWaveProps}
                  stroke="url(#cyanGlow)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <AnimatedPath
                  animatedProps={primaryWaveProps}
                  stroke="url(#pinkGlow)"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <AnimatedPath
                  animatedProps={voiceWaveProps}
                  stroke="url(#yellowGlow)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>

              {/* Status Pill Badge - LTR styled */}
              <View className="absolute bottom-2 flex-row-reverse items-center px-4 py-1.5 rounded-full border border-white/10 bg-black/60">
                <View
                  className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-secondary animate-pulse' : (isPlaying ? 'bg-primary' : 'bg-zinc-600')}`}
                  style={{ marginLeft: 8 }}
                />
                <Text className="text-[11px] font-bold font-assistant text-white" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                  {isSpeaking ? 'קריינות AI פעילה' : (isPlaying ? 'צליל היקפי פועל' : 'מצב השמעה מושהה')}
                </Text>
              </View>
            </View>

            {/* Media Controls Box */}
            <View className="flex-row items-center justify-between border-t border-white/5 pt-5 px-2">
              {/* Spatial Delay Button */}
              <Pressable
                onPress={toggleSurround}
                className={`w-12 h-12 rounded-full items-center justify-center border ${isSurround ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}
              >
                <Ionicons name="infinite" size={24} color={isSurround ? Colors.success : Colors.textSecondary} />
              </Pressable>

              {/* Central Play/Pause button */}
              <Pressable
                testID="play-pause-button"
                onPress={togglePlay}
                className="w-16 h-16 rounded-full items-center justify-center border border-white/15 shadow-xl bg-primary"
                style={({ pressed }) => [
                  pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }
                ]}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={30} color={Colors.white} />
              </Pressable>

              {/* Volume Adjusters */}
              <View className="flex-row items-center border border-white/10 rounded-full p-1 bg-white/5 gap-2">
                <Pressable
                  onPress={() => handleVolumeAdjust('down')}
                  className="w-9 h-9 rounded-full items-center justify-center"
                >
                  <Ionicons name="volume-low" size={18} color={Colors.textSecondary} />
                </Pressable>
                <Text className="text-white text-xs font-bold font-assistant w-7 text-center">
                  {Math.round(volume * 100)}%
                </Text>
                <Pressable
                  onPress={() => handleVolumeAdjust('up')}
                  className="w-9 h-9 rounded-full items-center justify-center"
                >
                  <Ionicons name="volume-high" size={18} color={Colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Ambient Track Selection Selector */}
        <Text className="text-white text-base font-bold font-assistant text-left mb-3" style={{ writingDirection: 'ltr' }}>
          🎵 בחרו מנגינת רקע סביבתית
        </Text>
        <View className="gap-3 mb-6">
          {SOUNDTRACKS.map((track) => {
            const isSelected = selectedTrack === track.id;
            return (
              <Pressable
                key={track.id}
                onPress={() => handleTrackChange(track.id)}
                className={`rounded-2xl border p-4 flex-row-reverse items-center justify-between transition ${isSelected ? 'bg-primary/10 border-primary' : 'bg-surfaceLight/40 border-white/5'}`}
              >
                <View className="w-6 h-6 rounded-full border-2 items-center justify-center" style={{ borderColor: isSelected ? Colors.primary : 'rgba(255,255,255,0.2)' }}>
                  {isSelected && <View className="w-3 h-3 rounded-full bg-primary" />}
                </View>
                <View className="flex-1 px-4 text-left">
                  <Text className="text-white text-sm font-bold font-assistant text-left mb-0.5" style={{ writingDirection: 'ltr' }}>
                    {track.title}
                  </Text>
                  <Text className="text-white/50 text-[11px] font-assistant text-left" style={{ writingDirection: 'ltr' }}>
                    {track.description}
                  </Text>
                </View>
                <Ionicons name="musical-notes-outline" size={20} color={isSelected ? Colors.primary : Colors.textMuted} />
              </Pressable>
            );
          })}
        </View>

        {/* AI Mood Capsule Controls */}
        <Text className="text-white text-base font-bold font-assistant text-left mb-3" style={{ writingDirection: 'ltr' }}>
          🌌 קפסולות מצבי רוח וקריינות AI
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-3 mb-5"
        >
          {MOOD_CAPSULES.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <Pressable
                key={mood.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedMood(mood.id);
                }}
                className={`flex-row-reverse items-center px-4 py-3 rounded-full border ${isSelected ? 'bg-secondary border-secondary text-black' : 'bg-surfaceLight/60 border-white/10'}`}
                style={{ marginHorizontal: 4 }}
              >
                <Text className="text-sm mr-1.5">{mood.emoji}</Text>
                <Text
                  className={`text-xs font-bold font-assistant ${isSelected ? 'text-black' : 'text-white'}`}
                  style={{ marginLeft: 6 }}
                >
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Custom mood prompt input */}
        <View className="rounded-2xl border border-white/10 bg-surfaceLight/30 p-4 mb-6">
          <Text className="text-white/60 text-xs font-assistant text-left mb-2" style={{ writingDirection: 'ltr' }}>
            הקלידו רעיון חופשי לאווירה (למשל: "קרב חלליות דרמטי סביב צדק עם לייזרים תלת-ממדיים"):
          </Text>
          <TextInput
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="מתח גבוה, צלילי מדע בדיוני..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white font-assistant text-right text-sm mb-4"
            multiline
            numberOfLines={2}
            style={{ writingDirection: 'rtl', textAlign: 'right' }}
          />

          {/* Trigger generator CTA Button */}
          <Pressable
            onPress={generateAtmosphere}
            disabled={isGenerating}
            className="rounded-xl overflow-hidden"
          >
            <LinearGradient
              colors={isGenerating ? ['#3F3F46', '#27272A'] : [Colors.primary, '#9B1B30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3.5 flex-row items-center justify-center gap-2"
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center justify-center gap-2">
                  <Ionicons name="sparkles" size={18} color={Colors.white} />
                  <Text className="text-white font-bold font-assistant text-sm">
                    צור אווירה קולנועית ב-AI
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Cinematic Hebrew Narrative output script */}
        {!!narrativeText && (
          <View className="rounded-3xl border border-white/15 overflow-hidden bg-surfaceLight/50 mb-4">
            <BlurView intensity={35} tint="dark" className="p-6">
              <View className="flex-row-reverse items-center justify-between border-b border-white/10 pb-3 mb-4">
                {!isGenerating && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      speakNarrative(narrativeText);
                    }}
                    disabled={isSpeaking}
                    className={`w-9 h-9 rounded-full items-center justify-center border ${isSpeaking ? 'bg-secondary/20 border-secondary/40' : 'bg-white/10 border-white/10'}`}
                  >
                    <Ionicons name="volume-medium-outline" size={18} color={isSpeaking ? Colors.secondary : Colors.white} />
                  </Pressable>
                )}
                <View className="flex-row-reverse items-center">
                  <Ionicons name="chatbox-ellipses-outline" size={18} color={Colors.primary} />
                  <Text className="text-white/60 text-xs font-assistant font-bold ml-2" style={{ marginLeft: 6, writingDirection: 'ltr' }}>
                    תסריט אווירה נוצר ב-AI
                  </Text>
                </View>
              </View>

              <Text className="text-white text-base font-assistant leading-7 text-left" style={{ writingDirection: 'ltr' }}>
                {narrativeText}
              </Text>
            </BlurView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  glowSphere: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
});