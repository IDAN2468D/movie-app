import React from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAcousticEngine } from '../hooks/useAcousticEngine';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: 'light' | 'medium' | 'deep';
  glow?: 'quantum' | 'emerald' | 'ruby' | 'none';
  specular?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  style,
  onPress,
  variant = 'deep',
  glow = 'quantum',
  specular = true,
}) => {
  const { playSpatialClick } = useAcousticEngine();
  // 120Hz Kinetic Fusion Spring Physics (stiffness: 100, damping: 15)
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.value = withSpring(0.97, { stiffness: 100, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 100, damping: 15 });
  };

  const handlePress = (e: GestureResponderEvent) => {
    playSpatialClick(e);
    if (onPress) onPress(e);
  };

  const getGlassStyle = () => {
    switch (variant) {
      case 'light':
        return styles.glassLight;
      case 'medium':
        return styles.glassMedium;
      case 'deep':
      default:
        return styles.glassDeep;
    }
  };

  const getGlowStyle = () => {
    switch (glow) {
      case 'quantum':
        return styles.quantumGlow;
      case 'emerald':
        return styles.emeraldGlow;
      case 'ruby':
        return styles.rubyGlow;
      case 'none':
      default:
        return null;
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.cardBase, getGlassStyle(), getGlowStyle(), animatedStyle, style]}>
        {specular && <View style={styles.specularHighlight} pointerEvents="none" />}
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  glassLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  glassMedium: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  glassDeep: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  quantumGlow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  emeraldGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  rubyGlow: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
});

export default LiquidGlassCard;
