/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Theme';

interface AIOrbProps {
  isRecording?: boolean;
  isProcessing?: boolean;
  size?: number;
}

const AIOrb: React.FC<AIOrbProps> = ({ 
  isRecording = false, 
  isProcessing = false, 
  size = 120 
}) => {
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    // Base floating animation
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );

    // Continuous rotation for the gradients
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000 }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(
        withTiming(1.3, { duration: 500 }),
        -1,
        true
      );
    } else if (isProcessing) {
      pulse.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulse.value = withSpring(1);
    }
  }, [isRecording, isProcessing]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(float.value, [0, 1], [-5, 5]) },
        { scale: pulse.value },
        { rotate: `${rotation.value}deg` }
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pulse.value,
      [1, 1.3],
      [0.3, 0.7],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale: pulse.value * 1.5 }],
    };
  });

  const innerLayerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `-${rotation.value * 1.5}deg` },
      { scale: 1 + (pulse.value - 1) * 0.5 }
    ]
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Glow */}
      <Animated.View 
        style={[
          styles.glow, 
          glowStyle, 
          { 
            backgroundColor: isRecording ? Colors.primary : Colors.secondary,
            borderRadius: size / 2 
          }
        ]} 
      />

      {/* Main Orb */}
      <Animated.View style={[styles.orbContainer, animatedStyle]}>
        <LinearGradient
          colors={[
            isRecording ? '#FF4D4D' : '#FFD700',
            isRecording ? '#9B1B30' : '#FFA500',
            isRecording ? '#4A0E0E' : '#8B4513'
          ]}
          style={[styles.orb, { borderRadius: size / 2 }]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill}>
            <View style={styles.specular} />
          </BlurView>
        </LinearGradient>
      </Animated.View>

      {/* Internal "Refractive" layers */}
      <Animated.View 
        style={[
          styles.innerLayer, 
          { 
            width: size * 0.7, 
            height: size * 0.7, 
            borderRadius: size * 0.35,
            opacity: 0.5
          },
          innerLayerStyle
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbContainer: {
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  orb: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    // Removed filter: blur as it is not supported in standard RN StyleSheet
  },
  specular: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: '30%',
    height: '30%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 50,
  },
  innerLayer: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});

export default AIOrb;
