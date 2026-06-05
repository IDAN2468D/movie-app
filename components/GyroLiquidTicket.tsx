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
import { Popcorn, Clapperboard, Star, Camera } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { Sensors } from '@/utils/SafeModules';

interface GyroLiquidTicketProps {
  primaryColor?: string;
  secondaryColor?: string;
}

const GyroLiquidTicket: React.FC<GyroLiquidTicketProps> = ({ 
  primaryColor = Colors.primary,
  secondaryColor = Colors.secondary 
}) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
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
  }, [tiltX, tiltY]);

  const blobStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * 2 },
      { translateY: tiltY.value * 2 },
    ]
  }));

  const blobStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -tiltX.value * 1.5 },
      { translateY: -tiltY.value * 1.5 },
    ]
  }));

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#0A0A0C] overflow-hidden">
      <Animated.View 
        style={[styles.blob, { backgroundColor: primaryColor, opacity: 0.3 }, blobStyle1]} 
        className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full"
      />
      <Animated.View 
        style={[styles.blob, { backgroundColor: secondaryColor, opacity: 0.2 }, blobStyle2]} 
        className="absolute -bottom-20 -right-20 w-[350px] h-[350px] rounded-full"
      />

      <FloatingIcon tiltX={tiltX} tiltY={tiltY} speed={4} style={{ top: '20%', start: '15%' }}>
        <Popcorn color="white" size={24} opacity={0.15} />
      </FloatingIcon>
      
      <FloatingIcon tiltX={tiltX} tiltY={tiltY} speed={3} style={{ top: '60%', end: '20%' }}>
        <Clapperboard color="white" size={28} opacity={0.1} />
      </FloatingIcon>
      
      <FloatingIcon tiltX={tiltX} tiltY={tiltY} speed={5} style={{ bottom: '15%', start: '30%' }}>
        <Star color={Colors.secondary} size={20} opacity={0.2} />
      </FloatingIcon>
      
      <FloatingIcon tiltX={tiltX} tiltY={tiltY} speed={2} style={{ top: '40%', end: '10%' }}>
        <Camera color="white" size={22} opacity={0.1} />
      </FloatingIcon>

      <View style={StyleSheet.absoluteFill} className="opacity-[0.03] bg-white/10" />
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
  blob: {},
  floatingIcon: {
    position: 'absolute',
  }
});

export default GyroLiquidTicket;
