import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

interface NeonGlowOverlayProps {
  glowIntensity: SharedValue<number>;
}

export const NeonGlowOverlay: React.FC<NeonGlowOverlayProps> = ({ glowIntensity }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowIntensity.value * 0.8, // Maximum opacity mapping
    };
  });

  return (
    <Animated.View 
      style={[styles.glow, animatedStyle]} 
      pointerEvents="none" 
    />
  );
};

const styles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(229, 255, 0, 0.15)', // Accent secondary neon-yellow/green color
    zIndex: 2,
  },
});

export default NeonGlowOverlay;
