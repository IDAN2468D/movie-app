import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Theme';
import { Sensors } from '@/utils/SafeModules';
import { useCineEffectsStore } from '@/store/useCineEffectsStore';

const { width, height } = Dimensions.get('window');

interface CineEffectsBackgroundProps {
  scrollY: SharedValue<number>;
  glowPrimary: SharedValue<string>;
  glowSecondary: SharedValue<string>;
}

interface PlasmaParticleProps {
  index: number;
  top: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  color: SharedValue<string> | string;
  plasmaPulse: SharedValue<number>;
}

function PlasmaParticle({
  index,
  top,
  left,
  right,
  color,
  plasmaPulse,
}: PlasmaParticleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      plasmaPulse.value,
      [0, 1],
      [0.8 + (index % 3) * 0.15, 1.2 + (index % 2) * 0.15]
    );
    const opacity = interpolate(
      plasmaPulse.value,
      [0, 1],
      [0.2 + (index % 4) * 0.08, 0.65 - (index % 3) * 0.08]
    );
    const backgroundColor = typeof color === 'string' ? color : color.value;
    return {
      transform: [{ scale }],
      opacity,
      backgroundColor,
    };
  });

  return (
    <Animated.View
      style={[
        styles.plasmaStar,
        { top, left, right },
        animatedStyle,
      ]}
    />
  );
}

export default function CineEffectsBackground({
  scrollY,
  glowPrimary,
  glowSecondary,
}: CineEffectsBackgroundProps) {
  const currentEffect = useCineEffectsStore((state) => state.currentEffect);

  // Shared values for Liquid Blobs
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  // Shared values for Gyroscope Parallax
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  // Shared values for Plasma Particles
  const plasmaPulse = useSharedValue(0);

  // 1. Loop animations for Liquid Blobs (only runs when mode is 'liquid')
  useEffect(() => {
    if (currentEffect !== 'liquid') return;

    blob1X.value = withRepeat(withTiming(width * 0.25, { duration: 8000 }), -1, true);
    blob1Y.value = withRepeat(withTiming(height * 0.15, { duration: 10000 }), -1, true);

    blob2X.value = withDelay(1000, withRepeat(withTiming(-width * 0.2, { duration: 9000 }), -1, true));
    blob2Y.value = withDelay(1000, withRepeat(withTiming(height * 0.08, { duration: 11000 }), -1, true));
  }, [currentEffect]);

  // 2. Loop animations for Plasma Particles (only runs when mode is 'plasma')
  useEffect(() => {
    if (currentEffect !== 'plasma') return;

    plasmaPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );
  }, [currentEffect]);

  // 3. Gyroscope listener (only runs when mode is 'gyro')
  useEffect(() => {
    if (currentEffect !== 'gyro') {
      // Clean up/Reset tilt when switching away
      tiltX.value = withTiming(0, { duration: 500 });
      tiltY.value = withTiming(0, { duration: 500 });
      return;
    }

    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    const startGyro = async () => {
      const Gyroscope = Sensors?.Gyroscope;

      if (!Gyroscope) {
        // Fallback: Slow floating animation
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(18, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(12, { duration: 5000 }), -1, true);
        }
        return;
      }

      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) throw new Error('Gyroscope not available');

        Gyroscope.setUpdateInterval(16);
        subscription = Gyroscope.addListener((data: { x: number; y: number }) => {
          if (isMounted) {
            tiltX.value = withSpring(data.y * 32, { damping: 22, stiffness: 80, mass: 1.0 });
            tiltY.value = withSpring(data.x * 32, { damping: 22, stiffness: 80, mass: 1.0 });
          }
        });
      } catch {
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(18, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(12, { duration: 5000 }), -1, true);
        }
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [currentEffect, tiltX, tiltY]);

  // --- ANIMATED STYLES ---

  // 1. Classical Ambient Glow Style
  const ambientGlowStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [0, 500], [1, 1.25], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 500], [0.15, 0.08], Extrapolation.CLAMP);
    return {
      backgroundColor: glowPrimary.value,
      opacity,
      transform: [{ scale }],
    };
  });

  // 2. Liquid Blobs Styles
  const liquidBlobStyle1 = useAnimatedStyle(() => {
    const scale = interpolate(blob1X.value, [0, width * 0.25], [1, 1.25], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: blob1X.value },
        { translateY: blob1Y.value },
        { scale },
      ],
      backgroundColor: glowPrimary.value,
    };
  });

  const liquidBlobStyle2 = useAnimatedStyle(() => {
    const scale = interpolate(blob2Y.value, [0, height * 0.08], [1, 1.3], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: blob2X.value },
        { translateY: blob2Y.value },
        { scale },
      ],
      backgroundColor: glowSecondary.value,
    };
  });

  // 3. Gyroscope Parallax Styles
  const gyroBlobStyle1 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 2.5 },
        { translateY: tiltY.value * 2.5 },
      ],
      backgroundColor: glowPrimary.value,
    };
  });

  const gyroBlobStyle2 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: -tiltX.value * 2.0 },
        { translateY: -tiltY.value * 2.0 },
      ],
      backgroundColor: glowSecondary.value,
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* BACKGROUND EFFECT SWITCHER */}

      {/* Mode A: Classic Ambient Glow */}
      {currentEffect === 'glow' && (
        <Animated.View
          style={[
            styles.glowBlob,
            {
              top: -150,
              left: '50%',
              marginLeft: -250,
              width: 500,
              height: 500,
              borderRadius: 250,
            },
            ambientGlowStyle,
          ]}
        />
      )}

      {/* Mode B: Fluid Liquid Motion */}
      {currentEffect === 'liquid' && (
        <>
          <Animated.View
            style={[
              styles.glowBlob,
              styles.liquidBlob1,
              liquidBlobStyle1,
            ]}
          />
          <Animated.View
            style={[
              styles.glowBlob,
              styles.liquidBlob2,
              liquidBlobStyle2,
            ]}
          />
        </>
      )}

      {/* Mode C: 3D Gyroscopic Space */}
      {currentEffect === 'gyro' && (
        <>
          <Animated.View
            style={[
              styles.glowBlob,
              styles.gyroBlob1,
              gyroBlobStyle1,
            ]}
          />
          <Animated.View
            style={[
              styles.glowBlob,
              styles.gyroBlob2,
              gyroBlobStyle2,
            ]}
          />
        </>
      )}

      {/* Mode D: Starry Plasma Particles */}
      {currentEffect === 'plasma' && (
        <View style={StyleSheet.absoluteFill}>
          {/* Base Ambient Glow under the stars */}
          <Animated.View
            style={[
              styles.glowBlob,
              {
                top: -100,
                left: '25%',
                width: 380,
                height: 380,
                borderRadius: 190,
              },
              ambientGlowStyle,
            ]}
          />

          {/* Render 5 Star/Plasma Particles floating at different spots */}
          <PlasmaParticle
            index={0}
            top="15%"
            left="15%"
            color={glowPrimary}
            plasmaPulse={plasmaPulse}
          />
          <PlasmaParticle
            index={1}
            top="25%"
            right="20%"
            color={glowSecondary}
            plasmaPulse={plasmaPulse}
          />
          <PlasmaParticle
            index={2}
            top="55%"
            left="10%"
            color={Colors.secondary}
            plasmaPulse={plasmaPulse}
          />
          <PlasmaParticle
            index={3}
            top="70%"
            right="15%"
            color={glowPrimary}
            plasmaPulse={plasmaPulse}
          />
          <PlasmaParticle
            index={4}
            top="85%"
            left="30%"
            color={glowSecondary}
            plasmaPulse={plasmaPulse}
          />
        </View>
      )}

      {/* Universal Glassmorphic Blur Overlay */}
      <BlurView
        intensity={90}
        tint="dark"
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glowBlob: {
    position: 'absolute',
    opacity: 0.15,
    zIndex: -2,
  },
  // Liquid Blob styling coordinates
  liquidBlob1: {
    top: -50,
    left: -50,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
  },
  liquidBlob2: {
    bottom: height * 0.15,
    right: -50,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
  },
  // Gyro Blob styling coordinates
  gyroBlob1: {
    top: -20,
    left: -20,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
  },
  gyroBlob2: {
    bottom: height * 0.1,
    right: -20,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
  },
  // Plasma starry particles
  plasmaStar: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    zIndex: -2,
  },
});
