/**
 * Checkout Screen - Final order summary and payment
 */
import * as React from 'react';
import { View, Text, Image, Pressable, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CreditCard, ShieldCheck, Ticket, CheckCircle2, Sparkles } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  ZoomIn, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  FadeOut
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cssInterop } from 'react-native-css-interop';

import { Colors, POSTER_SIZES } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { useCheckout } from '@/hooks/useCheckout';

// Interop external components to support NativeWind className
cssInterop(LinearGradient, { className: 'style' });

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  
  // Success animation styles - must be at top level, before any returns
  const ticketAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withTiming(15, { duration: 2000 }), -1, true) },
      { rotateZ: withRepeat(withTiming('1deg', { duration: 2500 }), -1, true) }
    ]
  }));

  // MGM Intro Video Player - must be at top level
  const [isIntroFinished, setIsIntroFinished] = React.useState(false);
  const mgmPlayer = useVideoPlayer('https://archive.org/download/mgm-1995/MGM%201995.mp4', (player) => {
    player.loop = false;
  });

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

  const [showAnimation, setShowAnimation] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    if (isSuccess) {
      setShowAnimation(true);
      setIsIntroFinished(false);
      
      // Start MGM Intro
      mgmPlayer.play();
      
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
      }, 9500); // Intro (4.5s) + Ticket animation (5s)

      return () => {
        clearTimeout(hapticTimer);
        clearTimeout(timer);
        clearTimeout(modalTimer);
        try {
          // Check if player is still valid before pausing to avoid "already released" error
          if (mgmPlayer) {
            mgmPlayer.pause();
          }
        } catch (e) {
          // Silent catch for released objects
        }
      };
    }
  }, [isSuccess, mgmPlayer, setIsIntroFinished, setShowAnimation, setShowModal]);


  if (!selectedShowtime) return null;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 gap-3">
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full bg-surface justify-center items-center">
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text className="text-h3 text-white font-display">סיכום הזמנה</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Movie Summary Card */}
        <View className="mt-6 rounded-3xl overflow-hidden border border-white/10 bg-surfaceLight p-4">
          <View className="flex-row gap-4">
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
              <View className="flex-row items-center gap-2 mb-1">
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
        <View className="mt-8 items-start">
          <Text className="text-h3 text-white mb-4 font-display">מושבים שנבחרו</Text>
          <View className="flex-row flex-wrap gap-2 justify-start">
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
            <View className="flex-row-reverse justify-between mb-4">
              <Text className="text-body text-textSecondary font-body">נשנושים ({snacksInCart.length})</Text>
              <Text className="text-body text-white font-display">₪{snacksTotal.toFixed(2)}</Text>
            </View>
          )}
          <View className="flex-row-reverse justify-between mb-4">
            <Text className="text-body text-textSecondary font-body">עמלת הזמנה</Text>
            <Text className="text-body text-white font-display">₪4.00</Text>
          </View>
          <View className="h-[1px] bg-white/5 my-2" />
          <View className="flex-row-reverse justify-between mt-2">
            <Text className="text-h2 text-white font-display">סה״כ לתשלום</Text>
            <Text className="text-h2 text-secondary font-display">₪{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Security Note */}
        <View className="mt-6 flex-row items-center justify-center gap-2 opacity-50 mb-10">
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
            className="flex-1 flex-row items-center justify-center gap-3"
          >
            <CreditCard size={20} color="white" />
            <Text className="text-white font-bold text-h3 font-display uppercase tracking-wider">
              {isProcessing ? 'מעבד תשלום...' : 'שלם עכשיו'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Cinematic Success Animation Overlay */}
      {showAnimation && (
        <Animated.View 
          entering={FadeIn.duration(800)}
          exiting={FadeOut.duration(500)}
          className="absolute inset-0 z-50 items-center justify-center bg-black/95"
        >
          <View className="absolute inset-0 bg-black/40" />
          
          {/* MGM Intro Layer */}
          {!isIntroFinished && (
            <Animated.View 
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(500)}
              className="absolute inset-0 z-50 bg-black items-center justify-center"
            >
              <VideoView 
                player={mgmPlayer} 
                style={{ width: '100%', height: '100%' }} 
                contentFit="contain"
                nativeControls={false}
              />
            </Animated.View>
          )}
          
          {/* Animated Background Glows */}
          {isIntroFinished && (
            <>
              <Animated.View 
                entering={FadeIn.delay(200)}
                className="absolute w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px]"
                style={{ top: '10%', left: '-20%' }}
              />
              <Animated.View 
                entering={FadeIn.delay(400)}
                className="absolute w-[400px] h-[400px] rounded-full bg-secondary/15 blur-[80px]"
                style={{ bottom: '10%', right: '-10%' }}
              />
            </>
          )}

          {isIntroFinished && (
            <Animated.View 
              entering={ZoomIn.duration(1000).springify().damping(15)}
              className="items-center z-10 overflow-visible"
            >
            {/* The Golden Ticket with Floating Animation */}
            <Animated.View 
              className="shadow-2xl shadow-secondary/60 relative"
              entering={FadeInDown.delay(600).duration(800)}
              style={ticketAnimatedStyle}
            >
              {/* Corner Success Badge on Ticket */}
              <Animated.View 
                entering={ZoomIn.delay(1200)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-secondary rounded-full items-center justify-center z-30 shadow-lg border-4 border-black"
              >
                <CheckCircle2 size={24} color={Colors.background} />
              </Animated.View>

              {/* Sparkles on Ticket Corners */}
              <Animated.View 
                entering={FadeIn.delay(1400)}
                className="absolute -top-8 -left-8 z-20"
              >
                <Sparkles size={40} color={Colors.secondary} />
              </Animated.View>
              <Animated.View 
                entering={FadeIn.delay(1600)}
                className="absolute -bottom-6 -right-6 z-20"
              >
                <Sparkles size={30} color={Colors.white} />
              </Animated.View>

              <Image 
                source={require('../../assets/images/golden_ticket.png')}
                style={{ width: 310, height: 175, borderRadius: 24 }}
                resizeMode="contain"
              />
              
              {/* Shine effect overlay */}
              <Animated.View 
                className="absolute inset-0 bg-white/20 rounded-3xl overflow-hidden"
                entering={FadeIn.delay(1000).duration(2000)}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0"
                  style={{ transform: [{ translateX: -100 }] }}
                />
              </Animated.View>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(1200).springify().damping(12)}
              className="mt-16 items-center bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md"
            >
              <Text className="text-secondary text-3xl font-bold tracking-[4px] uppercase mb-3 text-center" style={{ fontFamily: 'Outfit-Bold' }}>
                הזמנה אושרה!
              </Text>
              <View className="h-1 w-20 bg-secondary/30 rounded-full mb-4" />
              <Text className="text-white/80 text-xl text-center px-6 leading-relaxed" style={{ fontFamily: 'Inter-Regular' }}>
                הסרט <Text className="text-white font-bold">{selectedMovieTitle}</Text> מחכה לך.{'\n'}תהנה מחוויה קולנועית מושלמת.
              </Text>
            </Animated.View>
            </Animated.View>
          )}

          {/* Bottom hint */}
          <Animated.View 
            entering={FadeIn.delay(3000)}
            className="absolute bottom-12 items-center"
          >
            <Text className="text-white/30 text-xs font-label uppercase tracking-widest">טוען כרטיסים דיגיטליים...</Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Success Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-8">
          <View className="absolute inset-0 bg-black/60" />
          <Animated.View 
            entering={FadeInDown.springify()} 
            className="bg-surface p-8 rounded-[40px] items-center w-full border border-white/10"
          >
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-6">
              <CheckCircle2 size={48} color={Colors.background} />
            </View>
            <MarkerHighlight text="הזמנה בוצעה בהצלחה!" className="text-h2 text-white mb-2 text-left" />
            <Text className="text-body text-textSecondary text-left mb-8 font-body">
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
