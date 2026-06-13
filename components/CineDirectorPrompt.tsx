import React, { useEffect } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Mic, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SpringPresets = {
  snappy: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  }
};

const WaveBar = ({ index }: { index: number }) => {
  const height = useSharedValue(5);
  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(15 + (index % 3) * 6 + Math.random() * 8, { duration: 150 + (index % 5) * 50 }),
        withTiming(4, { duration: 150 + (index % 5) * 50 })
      ),
      -1,
      true
    );
  }, [index]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[{ width: 2.5, backgroundColor: Colors.primary, borderRadius: 1.25 }, barStyle]} />;
};

const SiriWaveform = () => {
  return (
    <View className="flex-row gap-[3px] items-center justify-center h-8 px-2">
      {Array.from({ length: 15 }).map((_, i) => (
        <WaveBar key={i} index={i} />
      ))}
    </View>
  );
};

const MicRipple = () => {
  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0.4);
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.4);

  useEffect(() => {
    scale1.value = withRepeat(withTiming(1.7, { duration: 1400 }), -1, false);
    opacity1.value = withRepeat(withTiming(0, { duration: 1400 }), -1, false);

    const timeout = setTimeout(() => {
      scale2.value = withRepeat(withTiming(1.7, { duration: 1400 }), -1, false);
      opacity2.value = withRepeat(withTiming(0, { duration: 1400 }), -1, false);
    }, 700);

    return () => clearTimeout(timeout);
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <>
      <Animated.View style={[{ position: 'absolute', inset: 0, borderRadius: 9999, backgroundColor: Colors.primary, zIndex: -1 }, style1]} />
      <Animated.View style={[{ position: 'absolute', inset: 0, borderRadius: 9999, backgroundColor: Colors.primary, zIndex: -1 }, style2]} />
    </>
  );
};

interface CineDirectorPromptProps {
  prompt: string;
  onChangePrompt: (text: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function CineDirectorPrompt({
  prompt,
  onChangePrompt,
  isRecording,
  onToggleRecording,
  onSubmit,
  disabled
}: CineDirectorPromptProps) {
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  return (
    <View className="bg-surfaceGlass/40 border border-white/8 rounded-[24px] p-5 mb-5">
      <Text className="text-h3 text-white text-left mb-3 font-display">2. מהו הרעיון העלילתי שלך?</Text>
      
      <View className="relative w-full mb-4">
        <TextInput
          value={prompt}
          onChangeText={onChangePrompt}
          placeholder="לדוגמה: קרב חלליות נועז סביב תל אביב העתיקה..."
          placeholderTextColor="rgba(255, 255, 255, 0.25)"
          multiline
          numberOfLines={4}
          textAlign="right"
          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-body font-sans text-right"
          style={{ minHeight: 90, textAlignVertical: 'top', paddingBottom: 50 }}
        />
        
        <View className="absolute bottom-2 left-3 flex-row items-center gap-2">
          {isRecording && <SiriWaveform />}
          
          <Pressable
            onPress={onToggleRecording}
            className={`w-10 h-10 rounded-full items-center justify-center border border-white/10 ${isRecording ? 'bg-primary' : 'bg-white/5'}`}
          >
            <Mic size={18} color="white" />
            {isRecording && <MicRipple />}
          </Pressable>
        </View>
      </View>

      <Pressable
        onPressIn={() => { buttonScale.value = withSpring(0.96, SpringPresets.snappy); }}
        onPressOut={() => { buttonScale.value = withSpring(1, SpringPresets.snappy); }}
        onPress={onSubmit}
        disabled={disabled}
        className="w-full rounded-xl overflow-hidden"
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        <Animated.View style={buttonStyle}>
          <LinearGradient
            colors={[Colors.primary, '#D40054']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 items-center justify-center flex-row gap-2"
          >
            <Sparkles size={18} color="white" />
            <Text className="font-bold text-white text-h3 font-display">צור תסריט וסטוריבורד 🎬</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}
