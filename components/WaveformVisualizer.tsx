import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, SharedValue } from 'react-native-reanimated';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  glowIntensity: SharedValue<number>;
}

const BAR_COUNT = 15;

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  glowIntensity,
}) => {
  // Create shared values for individual bar heights
  const heights = Array.from({ length: BAR_COUNT }, () => useSharedValue(6));

  useEffect(() => {
    let active = true;
    const timeouts: any[] = [];

    const animateBar = (index: number) => {
      if (!active) return;
      if (!isPlaying) {
        heights[index].value = withTiming(6, { duration: 300 });
        return;
      }

      // Heights flare up based on the glow intensity from haptic events
      const baseVal = 6 + Math.random() * 26;
      const multiplier = 1 + (glowIntensity.value || 0) * 1.8;
      const targetHeight = Math.min(50, baseVal * multiplier);
      const duration = 120 + Math.random() * 180;

      heights[index].value = withTiming(targetHeight, { duration });

      const t = setTimeout(() => animateBar(index), duration);
      timeouts.push(t);
    };

    if (isPlaying) {
      for (let i = 0; i < BAR_COUNT; i++) {
        animateBar(i);
      }
    } else {
      heights.forEach(h => {
        h.value = withTiming(6, { duration: 300 });
      });
    }

    return () => {
      active = false;
      timeouts.forEach(clearTimeout);
    };
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      {heights.map((h, i) => {
        const animatedStyle = useAnimatedStyle(() => {
          return {
            height: h.value,
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i % 2 === 0 ? '#E5FF00' : '#FF1464' },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

export default WaveformVisualizer;
