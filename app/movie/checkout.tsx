/**
 * Checkout Screen - Final order summary and payment
 */
import React from 'react';
import { View, Text, Image, Pressable, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, CreditCard, ShieldCheck, Ticket, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { cssInterop } from 'react-native-css-interop';

import { Colors, POSTER_SIZES } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { useCheckout } from '@/hooks/useCheckout';

// Interop external components to support NativeWind className
cssInterop(LinearGradient, { className: 'style' });
cssInterop(BlurView, { className: 'style' });

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const {
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
  } = useCheckout();

  if (!selectedShowtime) return null;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row-reverse items-center px-4 py-2 gap-3">
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full bg-surface justify-center items-center">
          <ArrowRight size={22} color={Colors.text} />
        </Pressable>
        <Text className="text-h3 text-white font-display">סיכום הזמנה</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Movie Summary Card */}
        <View className="mt-6 rounded-3xl overflow-hidden border border-white/10 bg-surfaceLight p-4">
          <View className="flex-row-reverse gap-4">
            {selectedMoviePoster ? (
              <Image 
                source={{ uri: `${POSTER_SIZES.medium}${selectedMoviePoster}` }}
                className="w-24 h-36 rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <View className="w-24 h-36 rounded-xl bg-surface justify-center items-center">
                <Ticket size={32} color={Colors.textMuted} />
              </View>
            )}
            <View className="flex-1 justify-center items-start">
              <MarkerHighlight text={selectedMovieTitle} className="text-h2 text-white mb-2" />
              <View className="flex-row-reverse items-center gap-2 mb-1">
                <Ticket size={14} color={Colors.primary} />
                <Text className="text-caption text-textSecondary font-body">
                  {selectedShowtime.hall} • {selectedShowtime.format}
                </Text>
              </View>
              <Text className="text-body text-white font-body">
                {selectedDate} • {selectedShowtime.time}
              </Text>
            </View>
          </View>
        </View>

        {/* Selected Seats */}
        <View className="mt-8 items-end">
          <Text className="text-h3 text-white mb-4 font-display">מושבים שנבחרו</Text>
          <View className="flex-row flex-wrap gap-2 justify-end">
            {selectedSeats.map((seat) => (
              <View key={`${seat.row}-${seat.number}`} className="bg-surfaceLight px-4 py-2 rounded-xl border border-white/5 items-center">
                <Text className="text-body text-white font-semibold">
                  {seat.row}{seat.number}
                </Text>
                <Text className="text-[10px] text-textMuted uppercase font-label">
                  {seat.type === 'vip' ? 'VIP' : 'רגיל'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price Breakdown */}
        <View className="mt-10 p-6 rounded-3xl bg-surface border border-white/5">
          <View className="flex-row-reverse justify-between mb-4">
            <Text className="text-body text-textSecondary font-body">מחיר כרטיסים</Text>
            <Text className="text-body text-white font-display">₪{totalPrice.toFixed(2)}</Text>
          </View>
          {snacksTotal > 0 && (
            <View className="flex-row justify-between mb-4">
              <Text className="text-body text-textSecondary font-body">נשנושים ({snacksInCart.length})</Text>
              <Text className="text-body text-white font-display">₪{snacksTotal.toFixed(2)}</Text>
            </View>
          )}
          <View className="flex-row justify-between mb-4">
            <Text className="text-body text-textSecondary font-body">עמלת הזמנה</Text>
            <Text className="text-body text-white font-display">₪4.00</Text>
          </View>
          <View className="h-[1px] bg-white/5 my-2" />
          <View className="flex-row justify-between mt-2">
            <Text className="text-h2 text-white font-display">סה״כ לתשלום</Text>
            <Text className="text-h2 text-secondary font-display">₪{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Security Note */}
        <View className="mt-6 flex-row-reverse items-center justify-center gap-2 opacity-50 mb-10">
          <ShieldCheck size={16} color={Colors.textSecondary} />
          <Text className="text-caption text-textSecondary font-body">תשלום מאובטח באמצעות SSL</Text>
        </View>
      </ScrollView>

      {/* Premium Footer Payment Button */}
      <View 
        className="px-6 pt-4 border-t border-white/5 bg-background/80 backdrop-blur-xl"
        style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
      >
        <Pressable 
          onPress={handlePayment}
          disabled={isProcessing}
          className={`h-16 rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 ${isProcessing ? 'opacity-70' : ''}`}
        >
          <LinearGradient
            colors={[Colors.primary, '#9B1B30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-1 flex-row-reverse items-center justify-center gap-3"
          >
            <CreditCard size={20} color="white" />
            <Text className="text-white font-bold text-h3 font-display uppercase tracking-wider">
              {isProcessing ? 'מעבד תשלום...' : 'שלם עכשיו'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Success Modal */}
      <Modal visible={isSuccess} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-8">
          <BlurView intensity={40} tint="dark" className="absolute inset-0" />
          <Animated.View 
            entering={FadeInDown.springify()} 
            className="bg-surface p-8 rounded-[40px] items-center w-full border border-white/10"
          >
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-6">
              <CheckCircle2 size={48} color={Colors.background} />
            </View>
            <MarkerHighlight text="הזמנה בוצעה בהצלחה!" className="text-h2 text-white mb-2 text-center" />
            <Text className="text-body text-textSecondary text-right mb-8 font-body">
              הכרטיסים שלך מחכים לך באזור האישי.{'\n'}
              שלחנו לך גם אימייל עם קוד ה-QR לסריקה מהירה בכניסה.
            </Text>
            
            <Pressable 
              onPress={handleFinish}
              className="w-full h-14 bg-white rounded-2xl items-center justify-center"
            >
              <Text className="text-background font-bold text-h3 font-display">חזרה לכרטיסים</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
