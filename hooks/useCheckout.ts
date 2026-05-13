import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSnacksStore } from '@/store/useSnacksStore';
import { NotificationService } from '@/services/NotificationService';

export const useCheckout = () => {
  const router = useRouter();
  const { 
    selectedMovieTitle, 
    selectedMoviePoster, 
    selectedShowtime, 
    selectedDate, 
    selectedSeats, 
    totalPrice,
    bookCurrentSelection,
    clearBooking
  } = useBookingStore();
  const { authenticateBiometrics } = useAuthStore();
  const { cart, items, getTotalPrice, clearCart } = useSnacksStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const snacksTotal = getTotalPrice();
  
  const snacksInCart = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => ({
      ...items.find(i => i.id === id),
      quantity
    })).filter(item => item.id !== undefined);
  }, [cart, items]);

  const finalTotal = totalPrice + snacksTotal + 4; // Including 4 NIS fee

  const handlePayment = useCallback(async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate biometric authentication
    const auth = await authenticateBiometrics('אשר את התשלום עבור הכרטיסים');
    
    if (auth) {
      await bookCurrentSelection();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSuccess(true);
      
      // Trigger confirmation notification
      NotificationService.notifyTicketPurchase(selectedMovieTitle, selectedSeats.length);
    } else {
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [authenticateBiometrics, bookCurrentSelection, selectedMovieTitle, selectedSeats.length]);

  const handleFinish = useCallback(() => {
    clearBooking();
    clearCart();
    router.replace('/(tabs)/tickets' as any);
  }, [clearBooking, clearCart, router]);

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
    snacksTotal,
    snacksInCart,
    finalTotal,
    isProcessing,
    isSuccess,
    handlePayment,
    handleFinish,
    goBack,
  };
};
