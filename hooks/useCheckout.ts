/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSnacksStore } from '@/store/useSnacksStore';
import NotificationService from '@/services/NotificationService';
import { Video } from '@/utils/SafeModules';
import { Audio } from '../utils/safeExpoAv';

export const useCheckout = () => {
  const selectedMovieId = useBookingStore(state => state.selectedMovieId);
  const selectedMovieTitle = useBookingStore(state => state.selectedMovieTitle);
  const selectedMoviePoster = useBookingStore(state => state.selectedMoviePoster);
  const selectedShowtime = useBookingStore(state => state.selectedShowtime);
  const selectedDate = useBookingStore(state => state.selectedDate);
  const selectedSeats = useBookingStore(state => state.selectedSeats);
  const totalPrice = useBookingStore(state => state.totalPrice);
  const bookCurrentSelection = useBookingStore(state => state.bookCurrentSelection);
  const clearBooking = useBookingStore(state => state.clearBooking);
  const deliveryMode = useBookingStore(state => state.deliveryMode);
  const setDeliveryMode = useBookingStore(state => state.setDeliveryMode);
  const myTickets = useBookingStore(state => state.myTickets);
  const { authenticateBiometrics } = useAuthStore();
  const { cart, items, getTotalPrice, clearCart } = useSnacksStore();
  
  // Business Logic States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const bookedTicketId = useMemo(() => {
    return myTickets[0]?.id || (myTickets[0] as any)?._id || '';
  }, [myTickets]);

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

  const soundRef = useRef<any>(null);

  // Configure Audio Mode once on hook initialization and handle cleanup on unmount
  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        if (typeof Audio.setAudioModeAsync === 'function') {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldRouteThroughEarpieceAndroid: false,
            allowsRecordingIOS: false,
            playThroughEarpieceAndroid: false,
          });
        }
      } catch (modeError) {
        console.warn('[useCheckout] Audio mode configuration warning:', modeError);
      }
    };
    setupAudioMode();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((err: any) => {
          console.warn('[useCheckout] Cleanup unload failed:', err);
        });
      }
    };
  }, []);

  const snacksTotal = getTotalPrice();
  
  const snacksInCart = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => ({
      ...items.find(i => i.id === id),
      quantity
    })).filter(item => item.id !== undefined);
  }, [cart, items]);

  const finalTotal = totalPrice + snacksTotal + 4; // Including 4 NIS fee

  const playRoar = useCallback(async () => {
    try {
      // Stop and unload existing sound if it is already loaded/playing
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (unloadErr) {
          // ignore
        }
        soundRef.current = null;
      }

      console.log('[useCheckout] Creating and playing lion roar sound...');
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/audio/lion_roar.mp3'),
        { volume: 0.9, shouldPlay: true }
      );
      
      soundRef.current = sound;

      // Auto unload sound after playing
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        }
      });
    } catch (e) {
      console.warn('[useCheckout] Failed to play roar:', e);
    }
  }, []);

  // Handle Success Sequence
  useEffect(() => {
    if (isSuccess) {
      setShowAnimation(true);
      setIsIntroFinished(false);
      
      // Play the sound after a slight delay to sync with screen transition
      const soundTimer = setTimeout(() => {
        playRoar();
      }, 500);
      
      // No mgmPlayer video anymore to prevent clashing audio / slow network loading
      setIsIntroFinished(false);
      
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
        clearTimeout(soundTimer);
        clearTimeout(hapticTimer);
        clearTimeout(timer);
        clearTimeout(modalTimer);
      };
    }
  }, [isSuccess, playRoar]);


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
      
      NotificationService.notifyTicketPurchase(selectedMovieTitle, selectedSeats.length, selectedMovieId || undefined);

      if (selectedDate && selectedShowtime?.time) {
        try {
          const dateParts = selectedDate.split('-');
          const timeParts = selectedShowtime.time.split(':');
          
          if (dateParts.length === 3 && timeParts.length >= 2) {
            const year = Number(dateParts[0]);
            const month = Number(dateParts[1]);
            const day = Number(dateParts[2]);
            const hour = Number(timeParts[0]);
            const minute = Number(timeParts[1]);
            
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour) && !isNaN(minute)) {
              const showtimeDate = new Date(year, month - 1, day, hour, minute);
              if (!isNaN(showtimeDate.getTime())) {
                NotificationService.scheduleMovieReminder(
                  selectedMovieTitle,
                  showtimeDate,
                  selectedMovieId || undefined,
                  selectedShowtime.hall
                );

                if (deliveryMode === 'pre-sync' && snacksInCart.length > 0) {
                  // Schedule delivery exactly 15 minutes after showtimeDate
                  const deliveryDate = new Date(showtimeDate.getTime() + 15 * 60 * 1000);
                  const firstSeat = selectedSeats[0];
                  if (firstSeat) {
                    NotificationService.scheduleSnackDeliveryReminder(
                      selectedMovieTitle,
                      deliveryDate,
                      selectedShowtime.hall,
                      firstSeat.row,
                      firstSeat.number
                    );
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to schedule movie reminder:', e);
        }
      }
    } else {
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [authenticateBiometrics, bookCurrentSelection, selectedMovieId, selectedMovieTitle, selectedSeats.length, selectedDate, selectedShowtime, snacksInCart, cart]);

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
    handlePayment,
    handleFinish,
    goBack,
    deliveryMode,
    setDeliveryMode,
    bookedTicketId,
    playRoar,
  };
};
