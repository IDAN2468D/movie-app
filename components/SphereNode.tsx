import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Image } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { TMDBMovie } from '@/lib/tmdb';
import { Colors, POSTER_SIZES } from '@/constants/Theme';

interface SphereNodeProps {
  movie: TMDBMovie;
  index: number;
  totalNodes: number;
  rotationX: SharedValue<number>;
  rotationY: SharedValue<number>;
  isActive: boolean;
  onPress: () => void;
}

export default function SphereNode({
  movie,
  index,
  totalNodes,
  rotationX,
  rotationY,
  isActive,
  onPress,
}: SphereNodeProps) {
  // Compute initial unit coordinates on the Fibonacci sphere
  const initialPos = useMemo(() => {
    const y = 1 - (index / (totalNodes - 1)) * 2; // y: 1 to -1
    const radius = Math.sqrt(1 - y * y); // radius at height y
    const theta = index * Math.PI * (3 - Math.sqrt(5)); // Golden angle
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    return { x, y, z };
  }, [index, totalNodes]);

  const animatedStyle = useAnimatedStyle(() => {
    const rx = rotationX.value;
    const ry = rotationY.value;

    // 1. Rotate around Y axis (yaw)
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x1 = initialPos.x * cosY - initialPos.z * sinY;
    const y1 = initialPos.y;
    const z1 = initialPos.x * sinY + initialPos.z * cosY;

    // 2. Rotate around X axis (pitch)
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    // Scale by physical sphere radius (fits nicely in mobile screens)
    const SPHERE_RADIUS = 130;
    const xScaled = x2 * SPHERE_RADIUS;
    const yScaled = y2 * SPHERE_RADIUS;
    const zScaled = z2 * SPHERE_RADIUS;

    // Camera distance for perspective projection
    const D = SPHERE_RADIUS * 2.8;
    const scaleFactor = (D + zScaled) / D;

    // Project coordinates
    const xProjected = xScaled * scaleFactor;
    const yProjected = yScaled * scaleFactor;

    // Visual attributes mapping
    const scale = scaleFactor;
    const opacity = 0.35 + 0.65 * ((z2 + 1) / 2);
    const zIndex = Math.round((z2 + 1) * 100);

    return {
      transform: [
        { translateX: xProjected },
        { translateY: yProjected },
        { scale: scale },
      ],
      opacity: opacity,
      zIndex: zIndex,
    };
  });

  const posterSource = movie.poster_path
    ? { uri: `${POSTER_SIZES.small}${movie.poster_path}` }
    : require('../assets/images/poster-placeholder.png');

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.nodeContainer,
        {
          borderColor: isActive ? Colors.primary : 'rgba(255, 255, 255, 0.12)',
          borderWidth: isActive ? 2.5 : 1,
          shadowColor: isActive ? Colors.primary : 'transparent',
          shadowOpacity: isActive ? 0.8 : 0,
          shadowRadius: isActive ? 12 : 0,
          elevation: isActive ? 10 : 0,
        },
      ]}
    >
      <Pressable onPress={onPress} style={styles.pressable}>
        <Image source={posterSource} style={styles.poster} resizeMode="cover" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pressable: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
});
