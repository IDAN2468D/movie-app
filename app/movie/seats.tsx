/**
 * Seat Selection Screen - Interactive seat picker with booking summary
 */
import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Check } from 'lucide-react-native';
import { Colors, Typography, Radius } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import SeatMap from '@/components/ZoomableSeatMap';
import { useBookingStore } from '@/store/useBookingStore';

export default function SeatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    selectedMovieTitle,
    selectedShowtime,
    selectedSeats,
    totalPrice,
    generateSeats,
    bookCurrentSelection,
    clearBooking,
  } = useBookingStore();

  useEffect(() => {
    generateSeats(8, 12); // 8 rows, 12 seats each
  }, []);

  const handleConfirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Save to store
    // router.push handles the transition, booking happens in checkout
    
    // Clear selection and go to tickets
    // Go to checkout instead of tickets
    router.push('/movie/checkout' as any);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Glass Header */}
      <View className="flex-row items-center px-4 pb-4 border-b border-white/10 gap-3 bg-surface">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface justify-center items-center">
          <ArrowRight size={22} color={Colors.text} />
        </Pressable>
        <View className="flex-1 items-start">
          <MarkerHighlight 
            text={selectedMovieTitle} 
            className="text-h3 text-white" 
            color={Colors.primary} 
          />
          <Text className="text-body text-textSecondary font-body">
            {selectedShowtime?.time} • {selectedShowtime?.format} •{' '}
            {selectedShowtime?.hall}
          </Text>
        </View>
      </View>

      {/* Seat Map */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        <SeatMap />

        {/* Selected seats summary */}
        {selectedSeats.length > 0 && (
          <View className="px-5 mt-5">
            <MarkerHighlight text="מושבים שנבחרו" className="text-h3 text-white mb-4" />
            <View className="flex-row flex-wrap gap-2.5 justify-start">
              {selectedSeats.map((seat) => (
                <View key={`${seat.row}-${seat.number}`} className="bg-surfaceLight px-4 py-2 rounded-full border border-primary">
                  <Text className="text-caption text-white font-semibold font-body">
                    {seat.row}
                    {seat.number}
                    {seat.type === 'vip' ? ' VIP' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Confirm CTA */}
      {selectedSeats.length > 0 && (
        <View 
          className="absolute start-4 end-4 rounded-[28px] overflow-hidden border border-white/10"
          style={{ 
            bottom: insets.bottom + 12,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 12
          }}
        >
          <View 
            className="flex-row-reverse items-center justify-between px-6 py-4 bg-surface"
          >
            <View className="gap-0 items-end">
              <Text className="text-h1 text-white font-display">₪{totalPrice.toFixed(0)}</Text>
              <Text className="text-caption text-textSecondary -mt-1 font-body">
                {selectedSeats.length} מושבים נבחרו
              </Text>
            </View>
            <Pressable 
              className="rounded-2xl overflow-hidden"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.96 : 1 }] }
              ]} 
              onPress={handleConfirm}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row-reverse items-center gap-2 px-8 py-3.5"
              >
                <Check size={20} color={Colors.background} />
                <Text className="text-background font-bold text-h3 font-display">אישור הזמנה</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// NativeWind migration complete - styles object removed
