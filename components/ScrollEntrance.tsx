/* eslint-disable react-hooks/immutability */
import React, { useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  SharedValue,
} from 'react-native-reanimated';

interface ScrollEntranceProps {
  children: React.ReactNode;
  scrollY: SharedValue<number>;
}

export default function ScrollEntrance({ children, scrollY }: ScrollEntranceProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const [layoutY, setLayoutY] = useState<number | null>(null);
  const hasEntered = useSharedValue(0);

  const handleLayout = (event: any) => {
    setLayoutY(event.nativeEvent.layout.y);
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (layoutY === null) {
      return { opacity: 0, transform: [{ scale: 0.95 }] };
    }

    const triggerPoint = layoutY - screenHeight + 120;

    if (scrollY.value > triggerPoint) {
      hasEntered.value = 1;
    }

    const opacity = withSpring(hasEntered.value, {
      damping: 18,
      stiffness: 90,
      overshootClamping: true,
    });

    const scale = withSpring(hasEntered.value === 1 ? 1 : 0.95, {
      damping: 18,
      stiffness: 90,
      overshootClamping: true,
    });

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View onLayout={handleLayout} style={styles.outerContainer}>
      <Animated.View style={[animatedStyle, styles.innerContainer]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
  },
  innerContainer: {
    width: '100%',
  },
});
