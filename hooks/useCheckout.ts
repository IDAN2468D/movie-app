/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSnacksStore } from '@/store/useSnacksStore';
import NotificationService from '@/services/NotificationService';
import { Video } from '@/utils/SafeModules';

export const useCheckout = () => {
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
  
  // Business Logic States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // UI Logic States
  const [showAnimation, setShowAnimation] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  // Reanimated Logic
  const ticketAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withTiming(15, { duration: 2000 }), -1, true) },
      { rotateZ: withRepeat(withTiming('1deg', { duration: 2500 }), -1, true) }
    ]
  }));

  // MGM Intro Video Player
  const mgmPlayer = Video?.useVideoPlayer('https://archive.org/download/mgm-1995/MGM%201995.mp4', (player: any) => {
    player.loop = false;
  });

  const snacksTotal = getTotalPrice();
  
  const snacksInCart = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => ({
      ...items.find(i => i.id === id),
      quantity
    })).filter(item => item.id !== undefined);
  }, [cart, items]);

  const finalTotal = totalPrice + snacksTotal + 4; // Including 4 NIS fee

  // Handle Success Sequence
  useEffect(() => {
    if (isSuccess) {
      setShowAnimation(true);
      setIsIntroFinished(false);
      
      // Start MGM Intro
      if (mgmPlayer) {
        mgmPlayer.play();
      } else {
        setIsIntroFinished(true);
      }
      
      // Haptics for the roar
      const hapticTimer = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1500);

      // Transition to ticket after intro
      const timer = setTimeout(() => {
        setIsIntroFinished(true);
      }, 4500);

      // Final modal transition
      const modalTimer = setTimeout(() => {
        setShowAnimation(false);
        setShowModal(true);
      }, 9500);

      return () => {
        clearTimeout(hapticTimer);
        clearTimeout(timer);
        clearTimeout(modalTimer);
        try {
          if (mgmPlayer) {
            mgmPlayer.pause();
          }
        } catch (e) {}
      };
    }
  }, [isSuccess, mgmPlayer]);

  const handlePayment = useCallback(async () => {
    const { user } = useAuthStore.getState();
    if (!user?.paymentMethods || user.paymentMethods.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const auth = await authenticateBiometrics('אשר את התשלום עבור הכרטיסים');
    
    if (auth) {
      const { submitOrder } = useSnacksStore.getState();
      
      if (Object.keys(cart).length > 0) {
        await submitOrder();
      }

      const snacksPayload = snacksInCart.map(item => ({
        id: item.id!,
        name: item.name!,
        price: item.price!,
        quantity: item.quantity,
        image: typeof item.image === 'string' ? item.image : String(item.id)
      }));
      await bookCurrentSelection(snacksPayload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSuccess(true);
      
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
  }, [clearBooking, clearCart]);

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
    showAnimation,
    showModal,
    isIntroFinished,
    ticketAnimatedStyle,
    mgmPlayer,
    handlePayment,
    handleFinish,
    goBack,
  };
};
