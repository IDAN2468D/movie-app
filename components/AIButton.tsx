import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';

interface AIButtonProps {
  onPress: () => void;
}

export const AIButton: React.FC<AIButtonProps> = ({ onPress }) => {
  const pulseScale = useSharedValue(1);
  const pressScale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [pulseScale, opacity]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: opacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.85, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  return (
    <Pressable 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedButtonStyle} className="items-center justify-center">
        <Animated.View 
          className="absolute w-16 h-16 rounded-full bg-primary/40"
          style={animatedRingStyle}
        />
        <View 
          className="bg-primary w-14 h-14 rounded-full items-center justify-center shadow-2xl" 
          style={{ elevation: 10, shadowColor: Colors.primary, shadowOpacity: 0.6 }}
        >
          <Sparkles size={24} color="white" />
        </View>
      </Animated.View>
    </Pressable>
  );
};
