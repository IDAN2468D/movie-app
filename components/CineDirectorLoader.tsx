import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Film } from 'lucide-react-native';

const CAPTIONS = [
  "ליהוק שחקנים לתפקידים... 🎭",
  "טעינת סליל פילם וירטואלי... 🎞️",
  "כתיבת דיאלוגים והנחיות משחק... ✍️",
  "עיבוד סצנות תאורה וקומפוזיציה... 💡",
  "סנכרון מנוע דיבור וסטוריבורד... 🔊"
];

export default function CineDirectorLoader() {
  const [captionIdx, setCaptionIdx] = useState(0);
  const rotation = useSharedValue(0);
  const scanY = useSharedValue(-50);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );

    scanY.value = withRepeat(
      withSequence(
        withTiming(50, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-50, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    const interval = setInterval(() => {
      setCaptionIdx((prev) => (prev + 1) % CAPTIONS.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const reelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  return (
    <Animated.View 
      entering={FadeIn}
      className="bg-surfaceGlass/40 border border-white/8 rounded-[32px] p-8 items-center justify-center mb-6 overflow-hidden"
    >
      <View className="relative w-28 h-28 items-center justify-center mb-5">
        <Animated.View style={reelStyle}>
          <Film size={56} color={Colors.primary} />
        </Animated.View>
        
        <Animated.View 
          style={[
            scanStyle,
            {
              position: 'absolute',
              width: 80,
              height: 2,
              backgroundColor: Colors.primary,
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
              elevation: 4,
            }
          ]} 
        />
      </View>

      <Text className="text-h3 text-white font-display text-center mb-1">הבמאי האישי מעבד את הסצנות...</Text>
      <Text 
        key={captionIdx}
        className="text-caption text-white/60 font-sans text-center h-5"
      >
        {CAPTIONS[captionIdx]}
      </Text>
    </Animated.View>
  );
}
