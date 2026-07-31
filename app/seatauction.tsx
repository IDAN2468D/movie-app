import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gavel, RefreshCw, X, Award, Info, CornerDownLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSeatAuctionSocket, IAuction } from '@/hooks/useSeatAuctionSocket';

export default function CineSeatAuctionScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((state) => state.token);
  const [bidValue, setBidValue] = useState('');
  const [selectedAuction, setSelectedAuction] = useState<IAuction | null>(null);

  const { auctions, loading, fetchActiveAuctions, placeBid } = useSeatAuctionSocket('showtime-101', token);

  useEffect(() => {
    fetchActiveAuctions();
  }, [fetchActiveAuctions]);

  const handlePlaceBid = async () => {
    if (!selectedAuction || !bidValue) return;
    const pointsBid = parseInt(bidValue, 10);
    if (isNaN(pointsBid) || pointsBid <= selectedAuction.highestBid) {
      Alert.alert('שגיאה', 'הצעת המחיר חייבת להיות גבוהה מההצעה הנוכחית');
      return;
    }
    await placeBid(selectedAuction._id, pointsBid);
    Alert.alert('ההצעה נקלטה', 'הצעתם בהצלחה נקודות על המושב!');
    setBidValue('');
    setSelectedAuction(null);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }} className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineSeat Swap & Auction</Text>
          <Pressable onPress={fetchActiveAuctions} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <RefreshCw size={18} color="white" />
          </Pressable>
        </View>

        {/* Info Banner */}
        <View className="bg-white/5 border border-white/10 p-4 rounded-3xl mb-6 flex-row-reverse justify-start items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-secondary/10 border border-secondary/30 items-center justify-center">
            <Info size={18} color={Colors.secondary} />
          </View>
          <View className="flex-1 items-end">
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-sm font-bold">שוק החלפת מושבים P2P</Text>
            <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/40 text-[11px] mt-0.5">הציעו את המושב שלכם תמורת מושב אחר או הציעו נקודות CinePass בשידור חי</Text>
          </View>
        </View>

        {/* Active List */}
        <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-base font-bold mb-4">מושבים פנויים להחלפה או ביד</Text>

        {loading && auctions.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.primary} className="my-8" />
        ) : auctions.length === 0 ? (
          <View className="bg-surfaceLight rounded-3xl p-8 items-center border border-white/5">
            <Text className="text-white/40 text-sm font-semibold">אין מושבים זמינים להחלפה כרגע</Text>
          </View>
        ) : (
          <View className="gap-4">
            {auctions.map((auc) => (
              <Animated.View key={auc._id} entering={FadeInDown.duration(500).springify()} className="bg-surfaceLight border border-white/10 rounded-3xl p-5 relative overflow-hidden">
                <LinearGradient colors={['rgba(255, 255, 255, 0.03)', 'transparent']} style={StyleSheet.absoluteFill} />
                <View className="flex-row-reverse justify-between items-center mb-3">
                  <View className="flex-row-reverse items-center gap-1.5">
                    <Text className="text-white text-lg font-bold">כסא {auc.originalSeat}</Text>
                    <Text className="text-white/40 text-xs">שייך ל-{auc.ownerId?.name || 'חבר'}</Text>
                  </View>
                  <View className="flex-row-reverse items-center gap-1 bg-secondary/10 border border-secondary/30 px-3 py-1 rounded-full">
                    <Award size={12} color={Colors.secondary} />
                    <Text className="text-secondary text-[11px] font-bold">
                      {auc.highestBid > 0 ? `${auc.highestBid} נקודות` : `${auc.pointsRequired} נקודות התחלה`}
                    </Text>
                  </View>
                </View>

                {auc.targetSeat && (
                  <View className="flex-row-reverse justify-start items-center gap-1.5 mb-4">
                    <CornerDownLeft size={12} color={Colors.primary} style={{ transform: [{ scaleX: -1 }] }} />
                    <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-primary text-xs font-bold">מחפש כסא: {auc.targetSeat}</Text>
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAuction(auc);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 items-center justify-center"
                >
                  <Text className="text-white text-xs font-bold">הגש הצעת ביד או בקש החלפה</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Bid Dialog */}
        {selectedAuction && (
          <Animated.View entering={FadeInDown} className="mt-6 bg-surfaceLight border border-primary/30 p-6 rounded-3xl">
            <View className="flex-row-reverse justify-between items-center mb-4">
              <Pressable onPress={() => setSelectedAuction(null)} className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                <X size={16} color="white" />
              </Pressable>
              <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-sm font-bold">הגש ביד על מושב {selectedAuction.originalSeat}</Text>
            </View>

            <TextInput
              value={bidValue}
              onChangeText={setBidValue}
              keyboardType="number-pad"
              placeholder="הכנס כמות נקודות..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={{ textAlign: 'right', writingDirection: 'rtl' }}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base mb-4"
            />

            <Pressable onPress={handlePlaceBid} className="rounded-2xl overflow-hidden">
              <LinearGradient colors={[Colors.primary, '#9B1B30']} className="py-3.5 flex-row justify-center items-center gap-2">
                <Gavel size={16} color="white" />
                <Text className="text-white text-sm font-bold">אשר הצעה בשידור חי</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
