/**
 * MarkerHighlight - Premium YUV design highlight component
 * Renders text with a signature 'marker stroke' background.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, type TextStyle, I18nManager } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withDelay
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';

interface MarkerHighlightProps {
  text: string;
  color?: string;
  style?: TextStyle;
  className?: string;
  delay?: number;
  numberOfLines?: number;
}

export function MarkerHighlight({ 
  text, 
  color = Colors.secondary, 
  style,
  className,
  delay = 300,
  numberOfLines
}: MarkerHighlightProps) {
  const widthScale = useSharedValue(0);

  useEffect(() => {
    // Reset and animate
    widthScale.value = 0;
    widthScale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 60 }));
  }, [delay]);

  const animatedStrokeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: widthScale.value }],
      opacity: widthScale.value * 0.8, // Combine with the 80% opacity
    };
  });

  const isRTL = I18nManager.isRTL;

  return (
    <View style={styles.container}>
      {/* The Marker Stroke */}
      <Animated.View 
        style={[
          styles.stroke,
          { 
            backgroundColor: color, 
            transformOrigin: isRTL ? 'right' : 'left' 
          },
          animatedStrokeStyle
        ]} 
      />
      
      <Text 
        className={`text-white z-10 font-display ${className}`} 
        style={style}
        numberOfLines={numberOfLines}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    position: 'relative',
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  stroke: {
    position: 'absolute',
    bottom: 4,
    left: -2,
    right: -2,
    height: '40%',
    borderRadius: 2,
  }
});

export default MarkerHighlight;
