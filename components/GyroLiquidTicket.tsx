import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  SharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { Sensors } from '@/utils/SafeModules';
import { getMovieTheme } from '../utils/movieTheme';
import { LinearGradient } from 'expo-linear-gradient';

interface GyroLiquidTicketProps {
  movieTitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tiltX?: SharedValue<number>;
  tiltY?: SharedValue<number>;
}

const GyroLiquidTicket: React.FC<GyroLiquidTicketProps> = ({ 
  movieTitle,
  primaryColor,
  secondaryColor,
  tiltX: passedTiltX,
  tiltY: passedTiltY
}) => {
  // Use passed shared values or fall back to local ones
  const localTiltX = useSharedValue(0);
  const localTiltY = useSharedValue(0);

  const tiltX = passedTiltX || localTiltX;
  const tiltY = passedTiltY || localTiltY;

  // Resolve theme settings from title
  const resolvedTheme = getMovieTheme(movieTitle);
  const themePrimary = primaryColor || resolvedTheme.primaryColor;
  const themeSecondary = secondaryColor || resolvedTheme.secondaryColor;
  const themeIcons = resolvedTheme.icons;

  useEffect(() => {
    // Only subscribe to gyroscope if we are NOT using passed-in shared values
    if (passedTiltX && passedTiltY) return;

    let subscription: { remove: () => void } | null = null;
    let isMounted = true;
    
    const startGyro = async () => {
      const Gyroscope = Sensors?.Gyroscope;
      
      if (!Gyroscope) {
        // Fallback: Slow floating animation
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(20, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(15, { duration: 5000 }), -1, true);
        }
        return;
      }

      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) throw new Error('Not available');

        Gyroscope.setUpdateInterval(16);
        subscription = Gyroscope.addListener((data: { x: number; y: number }) => {
          if (isMounted) {
            tiltX.value = withSpring(data.y * 30, { damping: 22, stiffness: 90, mass: 1.0 });
            tiltY.value = withSpring(data.x * 30, { damping: 22, stiffness: 90, mass: 1.0 });
          }
        });
      } catch {
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(20, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(15, { duration: 5000 }), -1, true);
        }
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
  }, [passedTiltX, passedTiltY, tiltX, tiltY]);

  // Blobs style transitions
  const blobStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * 2.5 },
      { translateY: tiltY.value * 2.5 },
    ]
  }));

  const blobStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -tiltX.value * 1.8 },
      { translateY: -tiltY.value * 1.8 },
    ]
  }));

  // Shiny glass glare overlay animation style
  const glareStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * 8 - 100 },
      { translateY: tiltY.value * 8 - 100 },
    ],
    opacity: withSpring(Math.max(0.08, Math.min(0.28, 0.16 + (tiltX.value + tiltY.value) / 150)))
  }));

  // Define static layout positions for 3 icons
  const iconPositions = [
    { top: '22%', start: '18%', speed: 3.5 },
    { top: '55%', end: '22%', speed: 2.2 },
    { bottom: '18%', start: '32%', speed: 4.8 }
  ];

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#09090B] overflow-hidden">
      {/* Liquid Glass Blobs */}
      <Animated.View 
        style={[styles.blob, { backgroundColor: themePrimary, opacity: 0.25 }, blobStyle1]} 
        className="absolute -top-28 -left-28 w-[420px] h-[420px] rounded-full"
      />
      <Animated.View 
        style={[styles.blob, { backgroundColor: themeSecondary, opacity: 0.18 }, blobStyle2]} 
        className="absolute -bottom-28 -right-28 w-[380px] h-[380px] rounded-full"
      />

      {/* Dynamic Thematic Floating Icons */}
      {themeIcons.slice(0, 3).map((IconComponent, idx) => {
        const pos = iconPositions[idx] || iconPositions[0];
        return (
          <FloatingIcon 
            key={`floating-icon-${idx}`}
            tiltX={tiltX} 
            tiltY={tiltY} 
            speed={pos.speed} 
            style={{ 
              position: 'absolute', 
              top: (pos as any).top, 
              bottom: (pos as any).bottom, 
              start: (pos as any).start, 
              end: (pos as any).end 
            }}
          >
            <IconComponent color="white" size={26} opacity={0.12} />
          </FloatingIcon>
        );
      })}

      {/* Ambient noise/reflection texture */}
      <View style={StyleSheet.absoluteFill} className="opacity-[0.02] bg-white" />

      {/* Reflective Glare Overlay */}
      <Animated.View 
        style={[{ position: 'absolute', top: -150, bottom: -150, width: 220, transform: [{ rotate: '25deg' }] }, glareStyle]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.35)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

interface FloatingIconProps {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  speed: number;
  style: ViewStyle;
  children: React.ReactNode;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({ tiltX, tiltY, speed, style, children }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * speed },
      { translateY: tiltY.value * speed },
    ]
  }));

  return (
    <Animated.View style={[styles.floatingIcon, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blob: {
    // Filter blur standard (if supported)
  },
  floatingIcon: {
    position: 'absolute',
  }
});

export default GyroLiquidTicket;
