import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

interface KineticContainerProps {
  shakeIntensity: SharedValue<number>;
  gyroX: SharedValue<number>;
  gyroY: SharedValue<number>;
  children: React.ReactNode;
}

export const KineticContainer: React.FC<KineticContainerProps> = ({
  shakeIntensity,
  gyroX,
  gyroY,
  children,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    // gyroX and gyroY create 3D parallax floating
    // shakeIntensity adds high frequency displacement
    return {
      transform: [
        { scale: 1.05 }, // Slightly scaled up to prevent showing black edges during shake/drift
        { translateX: shakeIntensity.value + gyroX.value },
        { translateY: gyroY.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});

export default KineticContainer;
