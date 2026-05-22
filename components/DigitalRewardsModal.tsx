/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, Image, Linking, Alert, Share, ActivityIndicator } from 'react-native';
import { Gift, X, Music, Image as ImageIcon, Ticket as TicketIcon } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown, ZoomIn, LinearTransition } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';

interface DigitalRewardsModalProps {
  visible: boolean;
  onClose: () => void;
  movieTitle: string;
}

export default function DigitalRewardsModal({ visible, onClose, movieTitle }: DigitalRewardsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [artUrl, setArtUrl] = useState<any>(null);

  const getConceptArt = (title: string) => {
    if (title.includes('מורטל')) return require('@/assets/images/mk2_concept_art.png');
    if (title.includes('מריו')) return require('@/assets/images/mario_concept_art.png');
    if (title.includes('המעניש')) return require('@/assets/images/punisher_concept_art.png');
    return require('@/assets/images/concept_art_sketch.png');
  };

  // Removed early return to allow Modal to handle its own visibility properly
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center px-4">
        <Animated.View 
          entering={ZoomIn.springify().damping(15)}
          exiting={FadeOutDown.duration(200)}
          className="bg-surface rounded-[32px] p-6 border border-white/20 items-center overflow-hidden"
        >
          <View className="absolute top-0 left-0 right-0 h-32 bg-secondary/20" />
          
          <View className="w-full flex-row justify-between items-start mb-2 z-10">
            <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
              <X color={Colors.text} size={24} />
            </Pressable>
            <View className="w-16 h-16 bg-secondary rounded-full items-center justify-center border-4 border-surface shadow-xl">
              <Gift color={Colors.background} size={32} />
            </View>
            <View className="w-10" />
          </View>

          <Text className="text-h2 text-white font-display mt-4 z-10 text-center">ההפתעות שלך נפתחו!</Text>
          <Text className="text-body text-textSecondary text-center mb-8 mt-2 z-10">
            תודה שצפית ב-{movieTitle}. הנה תכנים דיגיטליים בלעדיים בשבילך:
          </Text>

          <View className="w-full gap-4 z-10">
            <Animated.View entering={FadeInDown.delay(200)} className="w-full bg-white/5 p-4 rounded-3xl border border-white/10 flex-col overflow-hidden shadow-lg shadow-black/20">
              <View className="absolute inset-0 bg-primary/5 opacity-50" />
              <View className="flex-row items-center justify-between z-10 w-full">
                <View className="flex-row items-center gap-4 flex-1 pr-2">
                  <View className="w-14 h-14 bg-primary/20 rounded-2xl items-center justify-center border border-primary/30 shadow-sm shadow-primary/20 flex-shrink-0">
                    <Music color={Colors.primary} size={26} />
                  </View>
                  <View className="items-start flex-1">
                    <Text className="text-body text-white font-bold mb-0.5" style={{ writingDirection: 'ltr' }} numberOfLines={1}>הפסקול הרשמי</Text>
                    <Text className="text-caption text-textMuted" style={{ writingDirection: 'ltr' }} numberOfLines={1}>Apple Music & Spotify</Text>
                  </View>
                </View>
                <Pressable 
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Linking.openURL('https://open.spotify.com/').catch(() => {
                      Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור');
                    });
                  }}
                  className="bg-primary px-4 py-2.5 rounded-full shadow-md shadow-primary/30 flex-row items-center justify-center min-w-[80px] flex-shrink-0"
                >
                  <Text className="text-white font-bold text-[13px] tracking-wide" style={{ writingDirection: 'ltr' }}>האזן</Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View layout={LinearTransition.springify()} entering={FadeInDown.delay(400)} className="w-full bg-white/5 p-4 rounded-3xl border border-white/10 flex-col overflow-hidden shadow-lg shadow-black/20">
              <View className="absolute inset-0 bg-secondary/5 opacity-50" />
              <View className="flex-row items-center justify-between z-10 w-full">
                <View className="flex-row items-center gap-4 flex-1 pr-2">
                  <View className="w-14 h-14 bg-secondary/20 rounded-2xl items-center justify-center border border-secondary/30 shadow-sm shadow-secondary/20 flex-shrink-0">
                    <ImageIcon color={Colors.secondary} size={26} />
                  </View>
                  <View className="items-start flex-1">
                    <Text className="text-body text-white font-bold mb-0.5" style={{ writingDirection: 'ltr' }} numberOfLines={1}>AI Concept Art</Text>
                    <Text className="text-caption text-textMuted" style={{ writingDirection: 'ltr' }} numberOfLines={1}>סקיצות בלעדיות</Text>
                  </View>
                </View>
                {!artUrl && (
                  <Pressable 
                    disabled={isGenerating}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsGenerating(true);
                      setTimeout(() => {
                        setIsGenerating(false);
                        setArtUrl(getConceptArt(movieTitle));
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }, 2500);
                    }}
                    className={`px-4 py-2.5 rounded-full shadow-md ${isGenerating ? 'bg-secondary/50' : 'bg-secondary'} shadow-secondary/30 flex-row items-center justify-center gap-2 min-w-[80px] flex-shrink-0`}
                  >
                    {isGenerating && <ActivityIndicator size="small" color="#fff" />}
                    <Text className="text-white font-bold text-[13px] tracking-wide" style={{ writingDirection: 'ltr' }}>
                      {isGenerating ? 'מייצר...' : 'צפה'}
                    </Text>
                  </Pressable>
                )}
              </View>
              {artUrl && (
                <Animated.View entering={FadeInDown.delay(100)} className="mt-4 w-full aspect-video rounded-xl overflow-hidden border border-white/10 relative z-10">
                  <Image source={artUrl} className="w-full h-full" resizeMode="cover" />
                  <View className="absolute bottom-2 left-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    <Text className="text-[10px] text-white font-bold" style={{ writingDirection: 'ltr' }}>✨ Generated by Gemini NanoBanana</Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600)} className="w-full bg-white/5 p-4 rounded-3xl border border-white/10 flex-col overflow-hidden shadow-lg shadow-black/20">
              <View className="absolute inset-0 bg-green-500/5 opacity-50" />
              <View className="flex-row items-center justify-between z-10 w-full">
                <View className="flex-row items-center gap-4 flex-1 pr-2">
                  <View className="w-14 h-14 bg-green-500/20 rounded-2xl items-center justify-center border border-green-500/30 shadow-sm shadow-green-500/20 flex-shrink-0">
                    <TicketIcon color="#22c55e" size={26} />
                  </View>
                  <View className="items-start flex-1">
                    <Text className="text-base text-white font-black mb-0.5" style={{ writingDirection: 'ltr' }} numberOfLines={1}>15% הנחה לסרט הבא</Text>
                    <Text className="text-caption text-textMuted" style={{ writingDirection: 'ltr' }} numberOfLines={1}>קופון: CINEBOOK15</Text>
                  </View>
                </View>
                <Pressable 
                  onPress={async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    try {
                      await Share.share({
                        message: 'CINEBOOK15',
                        title: 'קופון הנחה CINEBOOK',
                      });
                    } catch (error) {
                      Alert.alert('שגיאה', 'לא ניתן לשתף את הקופון');
                    }
                  }}
                  className="bg-green-500 px-4 py-2.5 rounded-full shadow-md shadow-green-500/30 flex-row items-center justify-center min-w-[80px] flex-shrink-0"
                >
                  <Text className="text-white font-bold text-[13px] tracking-wide" style={{ writingDirection: 'ltr' }}>העתק</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
