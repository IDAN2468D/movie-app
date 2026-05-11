import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Ticket, Info } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import SeatMap from '@/components/ZoomableSeatMap';
import { useBookingStore } from '@/store/useBookingStore';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence
} from 'react-native-reanimated';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

export default function SeatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    selectedMovieTitle,
    selectedMoviePoster,
    selectedShowtime,
    selectedDate,
    selectedSeats,
    totalPrice,
    generateSeats,
  } = useBookingStore();

  useEffect(() => {
    // Generate seats if not already present
    generateSeats(8, 12);
  }, []);

  const handleConfirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/movie/checkout' as any);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    )
  }));

  return (
    <View className="flex-1 bg-background">
      {/* Cinematic Background */}
      <View className="absolute inset-0">
        <Image 
          source={{ uri: `${TMDB_IMAGE_BASE_URL}${selectedMoviePoster}` }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <BlurView intensity={100} tint="dark" className="absolute inset-0" />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)', Colors.background]} 
          className="absolute inset-0" 
        />
      </View>

      {/* Header with better hierarchy */}
      <View 
        className="flex-row-reverse items-center px-6 pb-4 pt-2 gap-4 z-20"
        style={{ marginTop: insets.top }}
      >
        <Pressable 
          onPress={() => router.back()} 
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 justify-center items-center"
        >
          <ChevronRight size={24} color="white" />
        </Pressable>
        
        <View className="flex-1 items-end">
          <Animated.Text entering={FadeInRight.delay(200)} className="text-h2 text-white font-display text-right leading-tight">
            {selectedMovieTitle}
          </Animated.Text>
          <View className="flex-row-reverse items-center gap-2 mt-1">
            <View className="px-2 py-0.5 rounded-md bg-primary/20 border border-primary/30">
              <Text className="text-[10px] text-primary font-bold">{selectedShowtime?.hall}</Text>
            </View>
            <Text className="text-caption text-white/50 font-medium">
              {selectedShowtime?.time} • {selectedDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Seat Map Container */}
      <View className="flex-1">
        <Animated.View entering={FadeIn.delay(400)} className="flex-1">
          <SeatMap />
        </Animated.View>
      </View>

      {/* Bottom Interface Layer */}
      <View className="absolute bottom-0 left-0 right-0 z-30">
        {/* Selected Seats Floating Bar */}
        {selectedSeats.length > 0 && (
          <Animated.View 
            entering={FadeInDown} 
            className="px-6 mb-6"
          >
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-label text-white/70 font-display">מושבים שנבחרו</Text>
              <View className="flex-row items-center gap-1">
                <Info size={12} color="rgba(255,255,255,0.4)" />
                <Text className="text-[10px] text-white/40">לחץ לביטול</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', paddingLeft: 20 }}>
              {selectedSeats.map((seat, index) => (
                <Animated.View 
                  key={`${seat.row}-${seat.number}`}
                  entering={FadeInRight.delay(index * 100)}
                  className="bg-white/10 border border-white/20 px-5 py-3 rounded-2xl ml-3 items-center backdrop-blur-md shadow-lg"
                >
                  <Text className="text-h3 text-white font-display">{seat.row}{seat.number}</Text>
                  <View className="w-4 h-0.5 bg-primary/40 rounded-full mt-1" />
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
        
        {/* Glossy Checkout Footer */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <BlurView 
            intensity={95} 
            tint="dark" 
            className="px-6 pt-8 border-t border-white/10 rounded-t-[44px] overflow-hidden shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
          >
            <View className="flex-row items-center justify-between">
              {/* Total Price (Right side in Hebrew) */}
              <View className="items-end">
                <Text className="text-caption text-white/40 font-bold uppercase tracking-[1px] mb-1">סה"כ לתשלום</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-h1 text-white font-display">₪{totalPrice.toFixed(0)}</Text>
                </View>
              </View>

              {/* Checkout Button (Left side in Hebrew) */}
              <Pressable 
                onPress={handleConfirm}
                disabled={selectedSeats.length === 0}
                className="overflow-hidden rounded-[24px] shadow-lg shadow-primary/20"
              >
                <Animated.View style={selectedSeats.length > 0 ? pulseStyle : {}}>
                  <LinearGradient
                    colors={selectedSeats.length > 0 ? [Colors.primary, '#9B1B30'] : ['#27272A', '#18181B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-row items-center gap-3 px-10 py-4"
                  >
                    <Ticket size={20} color={selectedSeats.length > 0 ? Colors.white : '#52525B'} />
                    <Text className={`font-bold text-h3 font-display ${selectedSeats.length > 0 ? 'text-white' : 'text-white/20'}`}>
                      הזמן עכשיו
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </View>
  );
}

// NativeWind migration complete - styles object removed
