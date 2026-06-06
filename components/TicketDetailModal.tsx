import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image, Share, Alert, ActivityIndicator } from 'react-native';
import { X, CreditCard, Share2, Cloud } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BookedTicket } from '@/store/useBookingStore';
import { Colors } from '@/constants/Theme';
import GyroLiquidTicket from './GyroLiquidTicket';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  ZoomIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { Sensors } from '@/utils/SafeModules';
import { getMovieTheme } from '@/utils/movieTheme';
import { GoogleDriveService } from '@/services/GoogleDriveService';

interface TicketDetailModalProps {
  ticket: BookedTicket | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function TicketDetailModal({ ticket, isVisible, onClose }: TicketDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (!isVisible) return;
    
    let subscription: { remove: () => void } | null = null;
    let isMounted = true;
    
    const startGyro = async () => {
      const Gyroscope = Sensors?.Gyroscope;
      if (!Gyroscope) {
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(15, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(12, { duration: 5000 }), -1, true);
        }
        return;
      }
      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) throw new Error('Not available');

        Gyroscope.setUpdateInterval(16);
        subscription = Gyroscope.addListener((data: { x: number; y: number }) => {
          if (isMounted) {
            tiltX.value = withSpring(data.y * 30, { damping: 20, stiffness: 80, mass: 1.0 });
            tiltY.value = withSpring(data.x * 30, { damping: 20, stiffness: 80, mass: 1.0 });
          }
        });
      } catch {
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(15, { duration: 4000 }), -1, true);
          tiltY.value = withRepeat(withTiming(12, { duration: 5000 }), -1, true);
        }
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
      tiltX.value = 0;
      tiltY.value = 0;
    };
  }, [isVisible]);

  const tiltStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${tiltY.value * 0.12}deg` },
        { rotateY: `${tiltX.value * 0.12}deg` },
      ]
    };
  });

  if (!ticket) return null;

  const movieTheme = getMovieTheme(ticket.movieTitle);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket.id}&color=${Colors.background.replace('#', '')}&bgcolor=FFFFFF`;

  const handleShare = async () => {
    if (!ticket) return;
    try {
      const seats = ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || '';
      const message = `🎬 כרטיס לסרט: ${ticket.movieTitle}\n📅 תאריך: ${ticket.date}\n⏰ שעה: ${ticket.showtime?.time}\n📍 אולם: ${ticket.showtime?.hall}\n💺 מושבים: ${seats}\n\nהזמנה מספר: ${ticket.id}\nנתראה ב-CineBook! 🍿`;
      
      await Share.share({
        message,
        title: 'הכרטיס שלי ל-CineBook',
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  const handleAddToWallet = async () => {
    if (!ticket) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'נוסף לארנק הדיגיטלי',
        `הכרטיס לסרט "${ticket.movieTitle}" נוסף בהצלחה לארנק שלך.`,
        [{ text: 'מעולה', style: 'default' }]
      );
    } catch (error) {
      console.error('Error adding to wallet:', error);
    }
  };

  const handleSaveToDrive = async () => {
    if (!ticket) return;
    setIsSavingToDrive(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await GoogleDriveService.uploadTicketToDrive(ticket);
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'נשמר ב-Google Drive',
          `הכרטיס לסרט "${ticket.movieTitle}" נשמר בהצלחה בתיקיית הדרייב שלך כקובץ PDF יוקרתי!`,
          [{ text: 'מעולה', style: 'default' }]
        );
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('שגיאת שמירה', result.message || 'לא ניתן לשמור ב-Google Drive כעת');
      }
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('שגיאה', error.message || 'שגיאת חיבור לשרת');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1">
      <View className="flex-1 bg-background">
          <View 
            className="flex-1 px-6" 
            style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
          >
            {/* Header */}
            <View className="flex-row-reverse justify-between items-center mb-8 z-20">
              <Pressable 
                onPress={onClose}
                className="w-12 h-12 items-center justify-center bg-white/10 rounded-2xl border border-white/20"
              >
                <X color="white" size={24} />
              </Pressable>
              <Text className="text-h2 text-white font-display">הכרטיס הדיגיטלי</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Ticket Body */}
              <Animated.View 
                entering={FadeInDown.springify().damping(18).stiffness(120).mass(1.0)}
                style={tiltStyle}
                className="bg-surfaceLight rounded-[48px] overflow-hidden border border-white/10 shadow-2xl relative"
              >
                {/* Liquid Background Layer */}
                <View className="absolute inset-0">
                  <GyroLiquidTicket 
                    movieTitle={ticket.movieTitle}
                    tiltX={tiltX} 
                    tiltY={tiltY} 
                  />
                </View>

                {/* Movie Header */}
                <View className="p-8 items-center border-b border-white/10 bg-black/40">
                  <Animated.Text 
                    entering={FadeIn.delay(300)}
                    className="text-h1 text-white font-display text-center leading-tight mb-2"
                    style={{ writingDirection: 'ltr' }}
                  >
                    {ticket.movieTitle}
                  </Animated.Text>
                  <View className="flex-row-reverse items-center opacity-60">
                    <Text className="text-label text-white font-body">{ticket.showtime?.hall || 'אולם'}</Text>
                    <View className="w-1 h-1 rounded-full bg-white mx-3" />
                    <Text className="text-label text-white font-body uppercase tracking-widest">{ticket.showtime?.format || 'רגיל'}</Text>
                  </View>
                </View>

                {/* Main QR Code Section */}
                <View className="p-10 items-center">
                  <Animated.View 
                    entering={ZoomIn.delay(500)}
                    className="p-6 bg-white rounded-[40px] shadow-2xl border-8 border-white/10"
                  >
                    <Image 
                      source={{ uri: qrUrl }}
                      style={{ width: 180, height: 180 }}
                      resizeMode="contain"
                    />
                  </Animated.View>
                  <Animated.Text 
                    entering={FadeIn.delay(700)}
                    className="mt-8 text-caption text-white/30 font-mono tracking-[6px] uppercase"
                  >
                    REF: {ticket.id.split('-')[0].toUpperCase()}
                  </Animated.Text>
                </View>

                {/* Perforation Line - Custom Glass Effect */}
                <View className="flex-row items-center h-6 overflow-hidden px-1">
                  <View className="w-10 h-10 rounded-full bg-background -ms-6 border border-white/10" />
                  <View className="flex-1 border-dashed border-white/20 mx-2 border-t-2" />
                  <View className="w-10 h-10 rounded-full bg-background -me-6 border border-white/10" />
                </View>

                {/* Ticket Details Grid */}
                <View className="p-8 pt-6 bg-white/5">
                  <View className="flex-row-reverse flex-wrap justify-between gap-y-8">
                    <DetailItem label="תאריך" value={ticket.date} />
                    <DetailItem label="שעה" value={ticket.showtime?.time || '--:--'} />
                    <DetailItem label="מושבים" value={ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || 'N/A'} color={movieTheme.secondaryColor} />
                    <DetailItem label="סטטוס" value="מאושר" color="#22c55e" />
                  </View>

                  <View className="h-[1px] bg-white/10 my-8" />

                  {/* Actions */}
                  <View className="gap-4">
                    <Pressable 
                      onPress={handleAddToWallet}
                      className="flex-row-reverse items-center justify-center bg-white h-16 rounded-[24px] gap-3 shadow-xl active:bg-gray-100"
                    >
                      <CreditCard color="black" size={20} />
                      <Text className="text-label text-black font-bold font-display uppercase tracking-wider">הוסף לארנק</Text>
                    </Pressable>
                    <Pressable 
                      onPress={handleSaveToDrive}
                      disabled={isSavingToDrive}
                      className="flex-row-reverse items-center justify-center bg-white/5 border border-white/10 h-16 rounded-[24px] gap-3 active:bg-white/10"
                    >
                      {isSavingToDrive ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Cloud color="white" size={20} />
                      )}
                      <Text className="text-label text-white font-bold font-display">
                        {isSavingToDrive ? 'שומר ב-Drive...' : 'שמור ב-Google Drive'}
                      </Text>
                    </Pressable>
                    <Pressable 
                      onPress={handleShare}
                      className="flex-row-reverse items-center justify-center bg-white/5 border border-white/10 h-16 rounded-[24px] gap-3 active:bg-white/10"
                    >
                      <Share2 color="white" size={20} />
                      <Text className="text-label text-white font-bold font-display">שתף עם חברים</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>

              {/* Safety Message */}
              <View className="mt-8 items-center opacity-60">
                <Text className="text-caption text-white text-center font-body leading-relaxed">
                  הכרטיס הונפק עבור המשתמש המחובר.{'\n'}
                  יש להציג את קוד ה-QR בכניסה לאולם.
                </Text>
              </View>
            </ScrollView>
          </View>
      </View>
      </View>
    </Modal>
  );
}

function DetailItem({ label, value, color = '#FFFFFF' }: { label: string; value: string; color?: string }) {
  return (
    <View className="w-[45%] items-start">
      <Text className="text-[10px] text-white/40 mb-1.5 font-label uppercase tracking-widest">{label}</Text>
      <Text className="text-label font-bold font-body text-left" style={{ color }}>{value}</Text>
    </View>
  );
}
