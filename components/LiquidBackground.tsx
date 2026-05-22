/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface LiquidBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
}

const LiquidBackground: React.FC<LiquidBackgroundProps> = ({ 
  primaryColor = '#E50914',
  secondaryColor = '#4A00E0'
}) => {
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  useEffect(() => {
    blob1X.value = withRepeat(withTiming(width * 0.3, { duration: 8000 }), -1, true);
    blob1Y.value = withRepeat(withTiming(height * 0.2, { duration: 10000 }), -1, true);
    
    blob2X.value = withDelay(1000, withRepeat(withTiming(-width * 0.2, { duration: 9000 }), -1, true));
    blob2Y.value = withDelay(1000, withRepeat(withTiming(height * 0.1, { duration: 11000 }), -1, true));
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob1X.value },
      { translateY: blob1Y.value },
      { scale: interpolate(blob1X.value, [0, width * 0.3], [1, 1.2], Extrapolate.CLAMP) }
    ],
    backgroundColor: primaryColor,
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob2X.value },
      { translateY: blob2Y.value },
      { scale: interpolate(blob2Y.value, [0, height * 0.1], [1, 1.3], Extrapolate.CLAMP) }
    ],
    backgroundColor: secondaryColor,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.blob, styles.blob1, style1]} />
      <Animated.View style={[styles.blob, styles.blob2, style2]} />
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    opacity: 0.4,
  },
  blob1: {
    top: -50,
    left: -50,
  },
  blob2: {
    bottom: 50,
    right: -50,
  },
});

export default LiquidBackground;
