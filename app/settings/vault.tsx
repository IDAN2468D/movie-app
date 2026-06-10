import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet, Dimensions, I18nManager } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, ChevronLeft, RefreshCw, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Colors, Typography } from '@/constants/Theme';
import { cssInterop } from 'react-native-css-interop';
import { useVaultStore } from '@/store/useVaultStore';
import CineVaultCard from '@/components/CineVaultCard';
import MarkerHighlight from '@/components/MarkerHighlight';

cssInterop(BlurView, { className: 'style' });

const { width } = Dimensions.get('window');

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { collectibles, isLoading, error, fetchCollectibles, syncCollectibles } = useVaultStore();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchCollectibles();
  }, [fetchCollectibles]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncCollectibles();
      if (result.success) {
        Alert.alert('הסנכרון הושלם!', result.message || 'הכרטיסים שלך סונכרנו בהצלחה.');
      } else {
        Alert.alert('שגיאת סנכרון', result.message || 'לא הצלחנו לסנכרן את הכרטיסים שלך.');
      }
    } catch (e) {
      Alert.alert('שגיאה', 'שגיאת תקשורת עם השרת.');
    } finally {
      setSyncing(false);
    }
  };

  // Ensure we show at least 6 slots (grid items) to give the "collect-them-all" layout
  const totalSlotsToShow = Math.max(6, collectibles.length + 2);
  const displayItems = Array.from({ length: totalSlotsToShow }).map((_, idx) => {
    if (idx < collectibles.length) {
      return { type: 'earned' as const, data: collectibles[idx] };
    } else {
      return { type: 'locked' as const, id: `locked-${idx}` };
    }
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10">
          {I18nManager.isRTL ? <ChevronRight size={24} color={Colors.text} /> : <ChevronLeft size={24} color={Colors.text} />}
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">
            כספת CineVault
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5" 
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <Animated.View 
          entering={FadeInDown.duration(600).springify()}
          className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6 mb-6 overflow-hidden relative"
        >
          <View className="flex-row items-center gap-3">
            <Trophy size={32} color={Colors.secondary} />
            <View className="flex-1">
              <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white', textAlign: 'right' }}>מוזיאון ההישגים שלך</Text>
              <Text style={{ fontFamily: 'Assistant-Regular', fontSize: 13, color: '#A1A1AA', marginTop: 4, textAlign: 'right' }}>
                כל כרטיס שרכשת בקולנוע הופך לגביש זכוכית הולוגרפי יפהפה. הטה את הטלפון שלך כדי לראות את השתקפות האור!
              </Text>
            </View>
          </View>

          {/* Sync Button */}
          <Pressable 
            onPress={handleSync}
            disabled={syncing || isLoading}
            className="bg-secondary rounded-2xl py-3 px-4 flex-row items-center justify-center gap-2 mt-5"
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#09090B" />
            ) : (
              <RefreshCw size={16} color="#09090B" />
            )}
            <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 14, color: '#09090B' }}>
              {syncing ? 'מסנכרן כרטיסים...' : 'סנכרן רכישות קודמות (+50 נק\')'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Shards Section Title */}
        <View className="flex-row items-center justify-between mb-4">
          <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: '#FAFAF7' }}>גבישי הזכוכית שלי</Text>
          <Text style={{ fontFamily: 'Assistant-SemiBold', fontSize: 14, color: Colors.primary }}>
            {collectibles.length} הישגים
          </Text>
        </View>

        {/* Error State */}
        {error && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
            <Text style={{ fontFamily: 'Rubik-Medium', fontSize: 14, color: '#EF4444', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && !syncing && collectibles.length === 0 ? (
          <View className="flex-1 py-20 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ fontFamily: 'Assistant-Regular', fontSize: 14, color: '#A1A1AA', marginTop: 12 }}>טוען את הכספת...</Text>
          </View>
        ) : (
          /* Grid of Collectibles */
          <Animated.View layout={LinearTransition} style={styles.grid}>
            {displayItems.map((item, index) => (
              <Animated.View 
                key={item.type === 'earned' ? item.data.id : item.id} 
                entering={FadeInDown.delay(index * 60).springify()}
              >
                <CineVaultCard 
                  collectible={item.type === 'earned' ? item.data : {
                    id: '',
                    movieId: 0,
                    movieTitle: '',
                    genre: '',
                    badgeType: 'glass',
                    shardId: '',
                    earnedAt: ''
                  }}
                  isLocked={item.type === 'locked'}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  }
});
