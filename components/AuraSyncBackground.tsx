import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuraSyncBackgroundProps {
  primaryColorShared: SharedValue<string>;
  secondaryColorShared: SharedValue<string>;
}

export default function AuraSyncBackground({
  primaryColorShared,
  secondaryColorShared,
}: AuraSyncBackgroundProps) {
  // Shared values for organic breathing movement
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const transX1 = useSharedValue(0);
  const transY1 = useSharedValue(0);
  const transX2 = useSharedValue(0);
  const transY2 = useSharedValue(0);

  useEffect(() => {
    // 1. Slow pulsation for Circle 1
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 8000 }),
        withTiming(0.9, { duration: 7000 })
      ),
      -1,
      true
    );

    // 2. Slow translation for Circle 1 (waving motion)
    transX1.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 11000 }),
        withTiming(-30, { duration: 9000 })
      ),
      -1,
      true
    );
    transY1.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 10000 }),
        withTiming(40, { duration: 12000 })
      ),
      -1,
      true
    );

    // 3. Slow pulsation for Circle 2
    scale2.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 9500 }),
        withTiming(0.85, { duration: 8500 })
      ),
      -1,
      true
    );

    // 4. Slow translation for Circle 2
    transX2.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 13000 }),
        withTiming(20, { duration: 10000 })
      ),
      -1,
      true
    );
    transY2.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 12000 }),
        withTiming(-40, { duration: 11000 })
      ),
      -1,
      true
    );
  }, []);

  const circle1Style = useAnimatedStyle(() => {
    return {
      backgroundColor: primaryColorShared.value,
      transform: [
        { scale: scale1.value },
        { translateX: transX1.value },
        { translateY: transY1.value },
      ],
    };
  });

  const circle2Style = useAnimatedStyle(() => {
    return {
      backgroundColor: secondaryColorShared.value,
      transform: [
        { scale: scale2.value },
        { translateX: transX2.value },
        { translateY: transY2.value },
      ],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#09090B] overflow-hidden">
      {/* Circle 1 - Primary Accent Blur Blob */}
      <Animated.View
        style={[
          styles.glowBlob,
          {
            top: SCREEN_HEIGHT * 0.15,
            left: -SCREEN_WIDTH * 0.1,
            opacity: 0.22,
          },
          circle1Style,
        ]}
      />

      {/* Circle 2 - Secondary Accent Blur Blob */}
      <Animated.View
        style={[
          styles.glowBlob,
          {
            bottom: SCREEN_HEIGHT * 0.2,
            right: -SCREEN_WIDTH * 0.1,
            opacity: 0.16,
          },
          circle2Style,
        ]}
      />

      {/* High-intensity glass blur plate to blend colors smoothly */}
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  glowBlob: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: (SCREEN_WIDTH * 0.85) / 2,
  },
});
