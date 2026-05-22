import React from 'react';
import { View, Text, Modal, Pressable, Share } from 'react-native';
import { Share2, X, Users, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown, FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  movieTitle: string;
}

export default function InviteModal({ visible, onClose, movieTitle }: InviteModalProps) {
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await Share.share({
        message: `בואו נלך לסרט ${movieTitle}! הזמנתי כרטיסים, לחצו על הקישור כדי לבחור מושב צמוד אליי ולשלם בנפרד דרך ה-Split Payment של CINEBOOK: https://cinebook.app/split/12345`,
        title: 'פיצול תשלום בקולנוע',
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOutDown.duration(200)} 
          className="absolute inset-0 bg-black/80" 
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View 
          entering={FadeInDown.springify().damping(15).mass(0.9)}
          exiting={FadeOutDown.duration(200)}
          className="bg-surface rounded-t-[36px] overflow-hidden border-t border-white/10 shadow-black/50"
          style={{ paddingBottom: 40, shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 20 }}
        >
          {/* Glass Gradient Background */}
          <View className="absolute inset-0 opacity-30">
            <LinearGradient
              colors={['#2a0a18', Colors.background]}
              style={{ flex: 1 }}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>

          {/* Grabber Handle */}
          <View className="w-full items-center pt-4 pb-2 z-10">
            <View className="w-12 h-1.5 bg-white/20 rounded-full" />
          </View>

          <View className="px-6 pt-2 pb-6 z-10 items-center">
            <View className="w-full flex-row justify-between items-center mb-6">
              <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                <X color={Colors.text} size={22} />
              </Pressable>
              <Text className="text-h2 text-white font-display">פיצול תשלום חברתי</Text>
              <View className="w-10" />
            </View>

            <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-6 border border-primary/30 shadow-xl shadow-primary/20">
              <Users color={Colors.primary} size={40} />
              <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-surfaceLight rounded-full items-center justify-center border border-white/10 shadow-sm">
                <CreditCard color={Colors.secondary} size={16} />
              </View>
            </View>

            <Text className="text-[16px] text-white text-center font-bold mb-2">
              לשבת ביחד, לשלם בנפרד!
            </Text>
            <Text className="text-body text-textSecondary text-center mb-8 px-2" style={{ lineHeight: 22 }}>
              שלח לחברים הזמנה אישית. הם יוכלו לתפוס את המושבים שלידך ולשלם על הכרטיס שלהם בלחיצת כפתור אחת. אין יותר "תעביר לי בביט"! 💸
            </Text>

            <Pressable 
              onPress={handleShare}
              className="w-full overflow-hidden rounded-2xl shadow-lg shadow-primary/30"
            >
              <LinearGradient
                colors={[Colors.primary, '#9B1B30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full h-[56px] items-center justify-center flex-row gap-3"
              >
                <Share2 color={Colors.background} size={20} />
                <Text className="text-background font-bold text-h3 font-display tracking-wide">שתף קישור הזמנה</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
