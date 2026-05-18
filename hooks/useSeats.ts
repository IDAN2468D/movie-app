import { useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBookingStore } from '@/store/useBookingStore';
import { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

export const useSeats = () => {
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
  }, [generateSeats]);

  const handleConfirm = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/movie/snacks' as any);
  }, [selectedSeats.length]);

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

  const goBack = () => {
    router.back();
  };

  return {
    selectedMovieTitle,
    selectedMoviePoster,
    selectedShowtime,
    selectedDate,
    selectedSeats,
    totalPrice,
    handleConfirm,
    pulseStyle,
    goBack,
  };
};
