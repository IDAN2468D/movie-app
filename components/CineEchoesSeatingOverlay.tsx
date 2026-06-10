import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Play, Square, Mic, X, Volume2 } from 'lucide-react-native';
import { Audio } from '@/utils/safeExpoAv';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { Colors } from '@/constants/Theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

interface CineEchoesSeatingOverlayProps {
  seatId: string; // e.g. "D4"
  echoData: { uri: string; userName: string; duration: string } | null;
  onClose: () => void;
  onSaveEcho: (seatId: string, uri: string) => void;
}

const WaveformBar = ({ index }: { index: number }) => {
  const height = useSharedValue(6);

  useEffect(() => {
    // Wave animation loops to simulate audio frequencies
    const delay = index * 100;
    height.value = withRepeat(
      withSequence(
        withTiming(14 + Math.random() * 24, { duration: 250 + Math.random() * 150 }),
        withTiming(6, { duration: 250 + Math.random() * 150 })
      ),
      -1,
      true
    );
  }, [index, height]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          backgroundColor: Colors.secondary,
          borderRadius: 2,
          marginHorizontal: 1.5,
        },
        style,
      ]}
    />
  );
};

export default function CineEchoesSeatingOverlay({
  seatId,
  echoData,
  onClose,
  onSaveEcho,
}: CineEchoesSeatingOverlayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(false);
  const soundRef = useRef<any>(null);

  const { isRecording, startRecording, stopRecording } = useVoiceRecording();

  const handlePlay = async () => {
    if (!echoData) return;
    setIsPlaybackLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Clean up previous sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const source = echoData.uri.startsWith('http') || echoData.uri.startsWith('file')
        ? { uri: echoData.uri }
        : require('@/assets/sounds/ambient.mp5'); // Fallback placeholder asset if mock URL

      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setIsPlaybackLoading(false);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.warn('[CineEchoes] sound play error, utilizing simulated fallback', error);
      // Simulated Playback fallback for Expo Go/Mock Mode
      setIsPlaybackLoading(false);
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
        soundRef.current = null;
      }, 5000);
    }
  };

  const handleStop = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStartRecord = async () => {
    await startRecording();
  };

  const handleStopRecord = async () => {
    const uri = await stopRecording();
    if (uri) {
      onSaveEcho(seatId, uri);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/60 z-50 p-6">
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View className="w-full max-w-[320px] bg-surface border border-white/10 rounded-[32px] overflow-hidden p-6 relative shadow-2xl">
        {/* Close Button */}
        <Pressable 
          onPress={onClose} 
          className="absolute top-4 start-4 w-9 h-9 items-center justify-center bg-white/5 rounded-full border border-white/10 z-10"
        >
          <X size={18} color="white" />
        </Pressable>

        <View className="items-center mt-4">
          <Volume2 size={32} color={Colors.primary} className="mb-3" />
          <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-white text-lg font-bold text-center">
            הדי מושב — {seatId}
          </Text>
          <Text style={{ fontFamily: 'Assistant-Regular' }} className="text-white/40 text-xs mt-1 text-center">
            ביקורות קוליות אותנטיות מחברי הקהילה
          </Text>
        </View>

        <View className="my-8 py-4 px-2 bg-white/5 rounded-2xl border border-white/5 items-center min-h-[96px] justify-center">
          {echoData ? (
            // Play Mode
            <View className="items-center w-full">
              <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-white text-sm mb-3">
                הקלטה מאת {echoData.userName} ({echoData.duration})
              </Text>
              
              {isPlaying ? (
                <View className="flex-row items-center justify-center h-12 mb-2">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <WaveformBar key={i} index={i} />
                  ))}
                </View>
              ) : (
                <Text style={{ fontFamily: 'Assistant' }} className="text-white/40 text-xs mb-3">
                  לחץ להאזנה לחוויה מהמושב
                </Text>
              )}

              {isPlaybackLoading ? (
                <ActivityIndicator color={Colors.secondary} />
              ) : isPlaying ? (
                <Pressable 
                  onPress={handleStop}
                  className="w-12 h-12 rounded-full bg-primary items-center justify-center"
                >
                  <Square size={18} color="white" fill="white" />
                </Pressable>
              ) : (
                <Pressable 
                  onPress={handlePlay}
                  className="w-12 h-12 rounded-full bg-secondary items-center justify-center"
                >
                  <Play size={18} color="black" fill="black" style={{ marginStart: 3 }} />
                </Pressable>
              )}
            </View>
          ) : (
            // Record Mode
            <View className="items-center w-full">
              <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-white text-sm mb-2">
                אין הדים קוליים במושב זה עדיין
              </Text>
              <Text style={{ fontFamily: 'Assistant' }} className="text-white/40 text-xs text-center px-4 mb-4">
                היה הראשון לשתף את הקהל בחוויית הצפייה שלך מכאן!
              </Text>

              {isRecording ? (
                <View className="items-center">
                  <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-primary text-xs animate-pulse mb-3">
                    ● מקליט (שחרר כדי לשמור)
                  </Text>
                  <Pressable 
                    onPressIn={handleStartRecord}
                    onPressOut={handleStopRecord}
                    className="w-14 h-14 rounded-full bg-primary items-center justify-center border-4 border-primary/30"
                  >
                    <Square size={20} color="white" fill="white" />
                  </Pressable>
                </View>
              ) : (
                <Pressable 
                  onPressIn={handleStartRecord}
                  onPressOut={handleStopRecord}
                  className="w-14 h-14 rounded-full bg-white/10 items-center justify-center border border-white/20 active:bg-white/20"
                >
                  <Mic size={22} color="white" />
                </Pressable>
              )}
            </View>
          )}
        </View>

        <Text style={{ fontFamily: 'Assistant' }} className="text-white/30 text-[10px] text-center">
          * ההדים נמחקים באופן אוטומטי לאחר 48 שעות
        </Text>
      </View>
    </View>
  );
}
