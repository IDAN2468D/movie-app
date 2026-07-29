import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, SharedValue } from 'react-native-reanimated';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  glowIntensity?: SharedValue<number>;
}

const BAR_COUNT = 16;

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  glowIntensity,
}) => {
  // 120Hz Zero-Reflow GPU scaleY SharedValues (strictly NO height reflows)
  const scaleYValues = Array.from({ length: BAR_COUNT }, () => useSharedValue(0.2));

  useEffect(() => {
    let active = true;
    const timeouts: any[] = [];

    const animateBar = (index: number) => {
      if (!active) return;
      if (!isPlaying) {
        scaleYValues[index].value = withTiming(0.15, { duration: 300 });
        return;
      }

      const intensityMult = 1 + (glowIntensity?.value || 0) * 1.5;
      const targetScale = Math.min(1.0, (0.2 + Math.random() * 0.8) * intensityMult);
      const duration = 100 + Math.random() * 160;

      scaleYValues[index].value = withTiming(targetScale, { duration });

      const t = setTimeout(() => animateBar(index), duration);
      timeouts.push(t);
    };

    if (isPlaying) {
      for (let i = 0; i < BAR_COUNT; i++) {
        animateBar(i);
      }
    } else {
      scaleYValues.forEach((s) => {
        s.value = withTiming(0.15, { duration: 300 });
      });
    }

    return () => {
      active = false;
      timeouts.forEach(clearTimeout);
    };
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      <View style={styles.specularTop} />
      {scaleYValues.map((scaleValue, i) => {
        const animatedStyle = useAnimatedStyle(() => {
          return {
            transform: [{ scaleY: scaleValue.value }],
          };
        });

        const isQuantum = i % 3 === 0;
        const isEmerald = i % 3 === 1;

        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              isQuantum ? styles.barQuantum : isEmerald ? styles.barEmerald : styles.barRuby,
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
    height: 64,
    gap: 5,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
    position: 'relative',
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  bar: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  barQuantum: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  barEmerald: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  barRuby: {
    backgroundColor: '#FF1464',
    shadowColor: '#FF1464',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});

export default WaveformVisualizer;
