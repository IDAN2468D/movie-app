/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Checkout Screen - Final order summary and payment
 */
import * as React from 'react';
import { View, Text, Image, Pressable, ScrollView, Modal, Linking, Alert, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, CreditCard, ShieldCheck, Ticket, CheckCircle2, Sparkles, Popcorn } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSnacksStore } from '@/store/useSnacksStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSquadBookingStore } from '@/store/useSquadBookingStore';
import { Video } from '@/utils/SafeModules';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  ZoomIn, 
  FadeOut
} from 'react-native-reanimated';
import { cssInterop } from 'react-native-css-interop';

import { Colors, POSTER_SIZES } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { useCheckout } from '@/hooks/useCheckout';
import InviteModal from '@/components/InviteModal';
import { Users } from 'lucide-react-native';
import ShekelRain from '@/components/ShekelRain';


// Interop external components to support NativeWind className
cssInterop(LinearGradient, { className: 'style' });

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
  } = useCheckout();
  const { items, addItem } = useSnacksStore();
  const { user, addVirtualCard } = useAuthStore();
  const [isInviteModalVisible, setIsInviteModalVisible] = React.useState(false);
  const { squadCode, sessionDetails } = useSquadBookingStore();
  const [showShekelRain, setShowShekelRain] = React.useState(false);



  if (!selectedShowtime) return null;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 gap-3">
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full bg-surface justify-center items-center">
          {I18nManager.isRTL ? <ArrowRight size={22} color={Colors.text} /> : <ArrowLeft size={22} color={Colors.text} />}
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
          
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsInviteModalVisible(true);
            }}
            className="mt-4 flex-row items-center gap-2 bg-secondary/10 px-4 py-3 rounded-xl border border-secondary/20"
          >
            <Users size={18} color={Colors.secondary} />
            <Text className="text-secondary font-bold text-body">פיצול תשלום עם חברים</Text>
          </Pressable>
        </View>

        {/* Ordered Snacks List */}
        {snacksInCart.length > 0 && (
          <View className="mt-8 items-start w-full">
            <Text className="text-h3 text-white mb-4 font-display">הכיבוד שהזמנת</Text>
            <View className="w-full bg-surfaceLight rounded-3xl border border-white/5 p-4 gap-3">
              {snacksInCart.map((item) => (
                <View key={item.id} className="flex-row items-center justify-between py-2 border-b border-white/5 last:border-b-0 w-full">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 bg-background/50 rounded-xl items-center justify-center border border-white/5 overflow-hidden">
                      {item.image ? (
                        <Image source={item.image} className="w-10 h-10" resizeMode="contain" />
                      ) : (
                        <Popcorn color={Colors.primary} size={20} opacity={0.6} />
                      )}
                    </View>
                    <View className="items-start">
                      <Text className="text-body text-white font-bold text-right" style={{ writingDirection: 'rtl' }}>{item.name}</Text>
                      <Text className="text-caption text-textSecondary text-right" style={{ writingDirection: 'rtl' }}>{item.description}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-body text-secondary font-display font-semibold">₪{((item.price || 0) * item.quantity).toFixed(2)}</Text>
                    <Text className="text-caption text-textSecondary">כמות: {item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Snack Delivery Mode Toggle */}
        {snacksInCart.length > 0 && (
          <View className="mt-6 items-start w-full">
            <Text className="text-h3 text-white mb-3 font-display">אופן הגשת הכיבוד</Text>
            <View className="w-full flex-row gap-3">
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDeliveryMode('immediate');
                }}
                className={`flex-1 p-4 rounded-2xl border ${deliveryMode === 'immediate' ? 'bg-primary/10 border-primary' : 'bg-surfaceLight border-white/5'} items-center`}
                style={deliveryMode === 'immediate' ? {
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                } : undefined}
              >
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 14, color: deliveryMode === 'immediate' ? Colors.primary : 'white' }}>איסוף עצמי 🍿</Text>
                <Text style={{ fontFamily: 'Assistant-Regular', fontSize: 10, color: '#A1A1AA', marginTop: 4, textAlign: 'center' }}>איסוף מהיר מהדלפק</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDeliveryMode('pre-sync');
                }}
                className={`flex-1 p-4 rounded-2xl border ${deliveryMode === 'pre-sync' ? 'bg-secondary/10 border-secondary' : 'bg-surfaceLight border-white/5'} items-center`}
                style={deliveryMode === 'pre-sync' ? {
                  shadowColor: Colors.secondary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                } : undefined}
              >
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 14, color: deliveryMode === 'pre-sync' ? Colors.secondary : 'white' }}>משלוח לכיסא 🛋️</Text>
                <Text style={{ fontFamily: 'Assistant-Regular', fontSize: 10, color: '#A1A1AA', marginTop: 4, textAlign: 'center' }}>יוגש עם סיום הטריילרים</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Pre-Order Snacks Section */}
        <View className="mt-10 items-start">
          <View className="flex-row w-full justify-between items-center mb-4">
            <Text className="text-h3 text-white font-display">נשנושים וכיבוד</Text>
            <View className="bg-secondary/20 px-3 py-1 rounded-full border border-secondary/30">
              <Text className="text-[10px] text-secondary font-bold uppercase tracking-widest">עוקף תור 🍿</Text>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-5 px-5" contentContainerStyle={{ gap: 24 }}>
            {items.map((snack) => {
              const count = snacksInCart.find(i => i.id === snack.id)?.quantity || 0;
              return (
                <Pressable 
                  key={snack.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    addItem(snack.id);
                  }}
                  className="w-40 bg-surfaceLight rounded-3xl border border-white/5 p-4 items-center"
                >
                  <View className="w-20 h-20 bg-background/50 rounded-2xl items-center justify-center mb-3 overflow-visible">
                    {snack.image ? (
                      <Image 
                        source={snack.image} 
                        className="w-16 h-16" 
                        resizeMode="contain" 
                      />
                    ) : (
                      <Popcorn color={Colors.primary} size={32} opacity={0.6} />
                    )}
                    {count > 0 && (
                      <View className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full items-center justify-center border-2 border-surface">
                        <Text className="text-white text-xs font-bold">{count}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-body text-white font-bold text-center mb-1" numberOfLines={1}>{snack.name}</Text>
                  <Text className="text-[10px] text-secondary font-display">₪{snack.price}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text className="text-caption text-textSecondary mt-4 font-body italic">
            * ההזמנה תחכה לך בדלפק המהיר עם הצגת הכרטיס
          </Text>
        </View>

        {/* CineCrew Lobby Sync & Split Billing Card */}
        {squadCode && sessionDetails && (
          <Animated.View entering={FadeInDown.delay(100)} className="mt-10 p-6 rounded-3xl bg-secondary/10 border border-secondary/20">
            <View className="flex-row items-center gap-2 mb-4 justify-end" style={{ flexDirection: 'row-reverse' }}>
              <Users size={18} color={Colors.secondary} />
              <Text className="text-h3 text-white font-display text-right">לובי הזמנה קבוצתי פעיל: {squadCode}</Text>
            </View>
            
            {/* List group member bill shares */}
            {sessionDetails.members.map((member) => {
              const memberSeatsCount = sessionDetails.lockedSeats.filter(s => s.userId === member.userId).length;
              const memberSeatsCost = memberSeatsCount * selectedShowtime.price;
              
              const memberSnacksCost = member.snacks 
                ? member.snacks.reduce((sum, s) => sum + s.price * s.quantity, 0)
                : 0;
                
              const memberShare = memberSeatsCost + memberSnacksCost;
              const isMe = member.userId === user?.id;
              
              return (
                <View key={member.userId} className="flex-row-reverse justify-between mb-3.5" style={{ flexDirection: 'row-reverse' }}>
                  <View className="flex-row-reverse items-center gap-2" style={{ flexDirection: 'row-reverse' }}>
                    <View className="w-6 h-6 rounded-full bg-white/10 items-center justify-center border border-white/20">
                      <Text className="text-[9px] text-white font-bold">{member.name.substring(0, 1)}</Text>
                    </View>
                    <Text className={`text-body font-body ${isMe ? 'text-secondary font-bold' : 'text-white/70'}`}>
                      {member.name} {isMe && '(אתה)'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-body text-white font-display">₪{memberShare.toFixed(0)}</Text>
                    <Text className="text-[9px] text-white/40 font-sans text-right">
                      {memberSeatsCount} מושבים • {member.snacks?.reduce((sum, s) => sum + s.quantity, 0) || 0} נשנושים
                    </Text>
                  </View>
                </View>
              );
            })}
            <View className="h-[1px] bg-white/10 my-3" />
            <View className="flex-row-reverse justify-between" style={{ flexDirection: 'row-reverse' }}>
              <Text className="text-body text-white/50 font-body">סה״כ לקבוצה</Text>
              <Text className="text-body text-white/80 font-display">
                ₪{(
                  sessionDetails.lockedSeats.length * selectedShowtime.price + 
                  sessionDetails.members.reduce((sum, m) => sum + (m.snacks ? m.snacks.reduce((sSum, s) => sSum + s.price * s.quantity, 0) : 0), 0)
                ).toFixed(0)}
              </Text>
            </View>
            <View className="mt-3.5 p-3 rounded-2xl bg-white/5 border border-white/5">
              <Text className="text-[9px] text-white/60 text-right font-sans">
                * כל חבר קבוצה משלם בנפרד את חלקו לפי הפירוט לעיל.
              </Text>
            </View>
          </Animated.View>
        )}

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
        <View className="mt-6 flex-row items-center justify-center gap-2 opacity-50">
          <ShieldCheck size={16} color={Colors.textSecondary} />
          <Text className="text-caption text-textSecondary font-body">תשלום מאובטח באמצעות SSL</Text>
        </View>

        {/* Payment Method Section */}
        <View className="mt-10 items-start mb-10">
          <Text className="text-h3 text-white mb-4 font-display">אמצעי תשלום</Text>
          
          {user?.paymentMethods && user.paymentMethods.length > 0 ? (
            user.paymentMethods.map((method) => (
              <View 
                key={method.id}
                className="w-full bg-surfaceLight p-5 rounded-3xl border border-secondary/20 flex-row-reverse items-center justify-between"
              >
                <View className="flex-row-reverse items-center gap-4">
                  <View className="w-12 h-8 bg-white/10 rounded-md items-center justify-center border border-white/10">
                    <CreditCard size={20} color={Colors.secondary} />
                  </View>
                  <View className="items-end">
                    <Text className="text-body text-white font-bold">{method.brand}</Text>
                    <Text className="text-caption text-textMuted">•••• {method.last4}</Text>
                  </View>
                </View>
                <View className="w-6 h-6 rounded-full bg-secondary items-center justify-center">
                  <CheckCircle2 size={16} color={Colors.background} />
                </View>
              </View>
            ))
          ) : (
            <Pressable 
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await addVirtualCard();
              }}
              className="w-full h-20 rounded-3xl border-2 border-dashed border-white/10 items-center justify-center bg-surfaceLight/30"
            >
              <View className="flex-row items-center gap-3">
                <Sparkles size={20} color={Colors.secondary} />
                <Text className="text-body text-white font-bold">הנפק כרטיס CineBook וירטואלי</Text>
              </View>
            </Pressable>
          )}
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
          className={`h-16 rounded-2xl overflow-hidden shadow-2xl  ${isProcessing ? 'opacity-70' : ''}`}
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
              <Animated.View 
                entering={ZoomIn.duration(1000).springify().damping(12)}
                className="items-center justify-center"
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    playRoar();
                  }}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                >
                  <Image 
                    source={require('../../assets/images/mgm_lion_hologram.png')}
                    style={{ width: 260, height: 260, borderRadius: 130 }}
                    resizeMode="cover"
                    className="border-4 border-secondary/35 shadow-2xl"
                  />
                </Pressable>
                <Animated.View 
                  entering={FadeInDown.delay(600).duration(800)}
                  className="mt-8 px-5 py-2.5 rounded-full border border-secondary/30 bg-secondary/10 flex-row items-center gap-2"
                  style={{ flexDirection: 'row-reverse' }}
                >
                  <Sparkles size={14} color={Colors.secondary} />
                  <Text className="text-secondary font-bold font-display tracking-widest text-[11px]">CINEBOOK ENTERTAINMENT</Text>
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}

          
          {/* Animated Background Glows */}
          {isIntroFinished && (
            <View className="absolute inset-0 overflow-hidden pointer-events-none">
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
            </View>
          )}

          {isIntroFinished && (
            <Animated.View 
              entering={ZoomIn.duration(1000).springify().damping(15)}
              className="items-center z-10 overflow-visible"
            >
            {/* The Golden Ticket with Floating Animation */}
            <Animated.View entering={FadeInDown.delay(600).duration(800)}>
              <Animated.View 
                className="shadow-2xl"
                style={[ticketAnimatedStyle, { shadowColor: Colors.secondary, shadowOpacity: 0.6 }]}
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
            
            {/* Redesigned Apple & Google Wallet Buttons Row */}
            <View className="flex-row gap-3 w-full mb-4">
              {/* Apple Wallet */}
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowShekelRain(true);
                  Alert.alert('נוסף לארנק', 'הכרטיס נשמר בהצלחה בארנק הדיגיטלי.');
                }}
                className="flex-1 h-14 bg-black border border-white/20 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg"
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}
              >
                <Text className="text-white font-bold text-[13px] font-display">Apple Wallet </Text>
              </Pressable>

              {/* Google Wallet */}
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowShekelRain(true);
                  Alert.alert('נוסף לארנק', 'הכרטיס נשמר בהצלחה בארנק הדיגיטלי.');
                }}
                className="flex-1 h-14 bg-[#0A0A0C] border border-[#3B82F6]/30 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg"
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}
              >
                <View className="w-5 h-5 rounded-full bg-[#3B82F6]/20 items-center justify-center border border-[#3B82F6]/40">
                  <Text className="text-[10px]">💳</Text>
                </View>
                <Text className="text-white font-bold text-[13px] font-display">Google Wallet</Text>
              </Pressable>
            </View>

            <Pressable 
              onPress={handleFinish}
              className="w-full h-14 bg-white rounded-2xl items-center justify-center"
            >
              <Text className="text-background font-bold text-h3 font-display">חזרה לכרטיסים</Text>
            </Pressable>
          </Animated.View>
          
          {showShekelRain && (
            <ShekelRain 
              amount={finalTotal} 
              onAnimationEnd={() => setShowShekelRain(false)} 
            />
          )}
        </View>
      </Modal>


      <InviteModal 
        visible={isInviteModalVisible} 
        onClose={() => setIsInviteModalVisible(false)} 
        movieTitle={selectedMovieTitle}
      />
    </View>
  );
}
