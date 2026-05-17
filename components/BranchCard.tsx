import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Zap } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  FadeInRight,
  interpolate
} from 'react-native-reanimated';
import { Branch } from '../constants/Branches';
import { Colors, Typography } from '../constants/Theme';
import { Sensors } from '../utils/SafeModules';
import { handleImageError } from '../utils/ImageUtils';

interface BranchCardProps {
  branch: Branch;
  index: number;
  isNearest?: boolean;
  onPress?: () => void;
}

export const BranchCard: React.FC<BranchCardProps> = ({ branch, index, isNearest, onPress }) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [imageSource, setImageSource] = useState<any>(
    typeof branch.image === 'string' ? { uri: branch.image } : branch.image
  );

  useEffect(() => {
    // Pulse animation for occupancy dot
    pulse.value = withRepeat(withTiming(1.5, { duration: 1000 }), -1, true);

    // Dynamic Gyroscope check (similar to GyroLiquidTicket)
    let subscription: any = null;
    let isMounted = true;

    const startGyro = async () => {
      try {
        if (Platform.OS === 'web') return;
        
        const Gyroscope = Sensors?.Gyroscope;
        if (!Gyroscope) return;

        const available = await Gyroscope.isAvailableAsync();
        
        if (available && isMounted) {
          Gyroscope.setUpdateInterval(16);
          subscription = Gyroscope.addListener((data: any) => {
            tiltX.value = data.y;
            tiltY.value = data.x;
          });
        }
      } catch {
        // Fallback for no gyro
      }
    };

    startGyro();
    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(tiltX.value * 20, { damping: 20 }) },
      { translateY: withSpring(tiltY.value * 20, { damping: 20 }) },
      { scale: 1.1 } // Slight zoom to allow for parallax movement without edges
    ]
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.5], [0.8, 0])
  }));

  const getOccupancyColor = (val: number) => {
    if (val > 80) return '#FF1464';
    if (val > 50) return '#E5FF00';
    return '#00FF94';
  };

  return (
    <Animated.View 
      entering={FadeInRight.delay(index * 100).springify()}
      className="mb-6 overflow-hidden rounded-[32px] border border-white/10"
    >
      <Pressable onPress={onPress}>
        <View className="h-48 w-full overflow-hidden">
          <Animated.Image 
            source={imageSource as any} 
            className="absolute inset-0 w-full h-full"
            style={imageStyle}
            resizeMode="cover"
            onError={() => handleImageError(setImageSource, 'backdrop')}
          />
          <LinearGradient
            colors={['rgba(9, 9, 11, 0.4)', 'rgba(9, 9, 11, 0.95)']}
            className="absolute inset-0"
          />
          
          <View className="absolute bottom-4 left-4 right-4">
            <View className="flex-row items-center mb-1">
              <View className="relative w-2 h-2 me-3">
                <Animated.View 
                  style={[pulseStyle, { backgroundColor: getOccupancyColor(branch.occupancy) }]} 
                  className="absolute inset-0 rounded-full"
                />
                <View 
                  style={{ backgroundColor: getOccupancyColor(branch.occupancy) }} 
                  className="absolute inset-0 rounded-full shadow-lg"
                />
              </View>
              <Text style={[Typography.caption, { textAlign: 'left' }]} className="text-white opacity-80">
                {branch.occupancy}% תפוסה • {branch.distance}
              </Text>
            </View>
            <Text style={[Typography.h2, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-white">{branch.name}</Text>
          </View>

          {isNearest && (
            <View className="absolute top-4 left-4 bg-primary px-3 py-1 rounded-full flex-row items-center shadow-lg">
              <Zap size={12} color="black" />
              <Text className="text-[10px] font-bold text-black ms-1">הכי קרוב אליך</Text>
            </View>
          )}
        </View>

        <BlurView intensity={25} tint="dark" className="p-5">
          <View className="flex-row items-center mb-4">
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={[Typography.body, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-textSecondary ms-2 flex-1" numberOfLines={1}>
              {branch.location}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {branch.features.map((feat, i) => (
              <View key={i} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 10, color: 'white' }}>{feat}</Text>
              </View>
            ))}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};
