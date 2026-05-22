/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, 
  Star, 
  Gift, 
  Zap, 
  X,
  CreditCard,
  History,
  Clock
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useLoyalty, REWARDS, TROPHIES } from '@/hooks/useLoyalty';

const ICON_MAP: Record<string, any> = {
  Gift,
  Star,
  Trophy,
  Zap,
};

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const {
    user, points, currentTier, nextTier, pointsRemaining, progressPercent,
    activities, showMemberCard, setShowMemberCard, showAllRewards, setShowAllRewards,
    scrollRef, formatDate, handleRedeem, scrollToHistory, handleSetActivityY, goBack,
  } = useLoyalty();

  return (
    <View className="flex-1 bg-background">
      {/* Background Accents */}
      <View className="absolute top-[-100] right-[-50] w-[300] h-[300] bg-primary/10 rounded-full blur-[80px]" />
      <View className="absolute bottom-[100] left-[-50] w-[250] h-[250] bg-secondary/10 rounded-full blur-[60px]" />

      <ScrollView 
        ref={scrollRef}
        className="flex-1" 
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 flex-row items-center justify-between mb-8">
          <Pressable 
            onPress={goBack}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center"
          >
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-h2 font-display">CinePass Premium</Text>
          <View className="w-12" />
        </View>

        {/* Points Card */}
        <Animated.View entering={FadeInDown.duration(600)} className="px-6">
          <LinearGradient
            colors={[Colors.primary, '#9B1B30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-[40px] p-8 shadow-2xl" style={{ shadowColor: Colors.primary, shadowOpacity: 0.3 }}
          >
            <View className="flex-row justify-between items-start mb-6">
              <View className="items-start">
                <Text className="text-white/70 text-[14px] font-medium animate-pulse" style={{ fontFamily: 'Rubik-Medium', textAlign: 'right' }}>הנקודות שלך</Text>
                <Text className="text-white text-[48px] font-bold" style={{ fontFamily: 'Rubik-Bold' }}>{points}</Text>
              </View>
              <View className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                <Trophy size={32} color="white" />
              </View>
            </View>

            {/* Progress to Gold Tier */}
            <View className="mb-2 flex-row justify-between items-center" style={{ flexDirection: 'row-reverse' }}>
              <Text className="text-white/80 text-[12px] font-bold">{currentTier}</Text>
              <Text className="text-white/80 text-[12px] font-bold">
                {pointsRemaining > 0 ? `עוד ${pointsRemaining} נקודות ל${nextTier}` : 'הגעת לדרגת מועדון מקסימלית!'}
              </Text>
            </View>
            <View className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
              <View className="h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <View className="flex-row px-6 mt-8 gap-4">
          <Pressable 
            onPress={() => setShowMemberCard(true)}
            className="flex-1 bg-surfaceLight border border-white/5 p-5 rounded-[28px] items-center"
            style={({ pressed }) => [pressed && { opacity: 0.7, scale: 0.98 }]}
          >
            <CreditCard size={24} color={Colors.primary} />
            <Text className="text-white text-[13px] mt-2 font-bold" style={{ fontFamily: 'Rubik-Bold' }}>כרטיס חבר</Text>
          </Pressable>
          <Pressable 
            onPress={scrollToHistory}
            className="flex-1 bg-surfaceLight border border-white/5 p-5 rounded-[28px] items-center"
            style={({ pressed }) => [pressed && { opacity: 0.7, scale: 0.98 }]}
          >
            <History size={24} color={Colors.secondary} />
            <Text className="text-white text-[13px] mt-2 font-bold" style={{ fontFamily: 'Rubik-Bold' }}>היסטוריה</Text>
          </Pressable>
        </View>

        {/* Available Rewards */}
        <View className="mt-10">
          <View className="px-6 flex-row items-center justify-between mb-6">
            <Text className="text-white text-h2 font-display text-left">הטבות בשבילך</Text>
            <Pressable 
              onPress={() => setShowAllRewards(true)}
              hitSlop={20}
            >
              <Text className="text-primary text-[14px] font-bold">הכל</Text>
            </Pressable>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            style={{ transform: [{ scaleX: -1 }] }}
          >
            {REWARDS.map((reward, index) => (
              <Animated.View 
                key={reward.id} 
                entering={FadeInRight.delay(index * 100).duration(500)}
                layout={Layout.springify()}
              >
                <View className="w-[260px] bg-surfaceLight border border-white/5 rounded-[32px] p-6" style={{ transform: [{ scaleX: -1 }] }}>
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-4 self-start"
                  style={{ backgroundColor: `${reward.color}20` }}
                >
                  {(() => {
                    const Icon = ICON_MAP[reward.icon] || Gift;
                    return <Icon size={28} color={reward.color} />;
                  })()}
                </View>
                <Text className="text-white text-[18px] font-bold mb-2 text-left" style={{ fontFamily: 'Rubik-Bold' }}>{reward.title}</Text>
                <Text className="text-textMuted text-[13px] leading-relaxed mb-6 text-left" style={{ fontFamily: 'Rubik-Regular' }}>{reward.description}</Text>
                <Pressable 
                  onPress={() => handleRedeem(reward)}
                  className="bg-white/5 py-3 rounded-xl border border-white/10 items-center"
                  style={({ pressed }) => [pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                >
                  <Text className="text-white font-bold text-[14px]">{reward.points} נקודות</Text>
                </Pressable>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Trophies & Achievements */}
        <View className="mt-10">
          <Text className="text-white text-h2 font-display px-6 mb-6 text-left">גביעים והישגים</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            style={{ transform: [{ scaleX: -1 }] }}
          >
            {TROPHIES.map((trophy, index) => {
              const isUnlocked = user?.loyaltyTrophies?.includes(trophy.name);
              return (
                <View 
                  key={trophy.id}
                  className="w-[200px] bg-surfaceLight border border-white/5 rounded-[32px] p-5 items-center relative overflow-hidden"
                  style={{ opacity: isUnlocked ? 1 : 0.4, transform: [{ scaleX: -1 }] }}
                >
                  {!isUnlocked && (
                    <View className="absolute top-3 right-3 bg-black/40 p-1.5 rounded-full border border-white/10">
                      <X size={10} color="white" />
                    </View>
                  )}
                  <View 
                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                    style={{ backgroundColor: isUnlocked ? `${trophy.color}20` : 'rgba(255,255,255,0.05)' }}
                  >
                    <Trophy size={32} color={isUnlocked ? trophy.color : '#888888'} />
                  </View>
                  <Text className="text-white text-[16px] font-bold mb-2 text-center" style={{ fontFamily: 'Rubik-Bold' }}>{trophy.name}</Text>
                  <Text className="text-textMuted text-[11px] text-center leading-relaxed" style={{ fontFamily: 'Rubik-Regular' }}>{trophy.description}</Text>
                  <View className="mt-4 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Text className="text-[10px] font-bold" style={{ color: isUnlocked ? trophy.color : '#888888' }}>
                      {isUnlocked ? 'פתוח 🔓' : 'נעול 🔒'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View 
          className="mt-10 px-6" 
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            handleSetActivityY(layout.y);
          }}
        >
          <Text className="text-white text-h2 font-display mb-6 text-left">פעילות אחרונה</Text>
          <View className="bg-surfaceLight border border-white/5 rounded-[32px] overflow-hidden">
            {activities.map((item, index, arr) => (
              <View 
                key={index.toString()} 
                className={`p-5 flex-row items-center justify-between ${index !== arr.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center shrink-0">
                    <Clock size={18} color={Colors.textMuted} />
                  </View>
                  <View className="items-start flex-1" style={{ marginHorizontal: 8 }}>
                    <Text 
                      className="text-white text-[14px] font-bold text-left" 
                      style={{ fontFamily: 'Rubik-Bold' }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.action}
                    </Text>
                    <Text className="text-textMuted text-[12px] text-left">{formatDate(item.date)}</Text>
                  </View>
                </View>
                <Text className={`font-bold shrink-0 ${item.points.startsWith('+') ? 'text-secondary' : 'text-primary'}`}>{item.points}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* All Rewards Modal */}
      <Modal
        visible={showAllRewards}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllRewards(false)}
      >
        <View className="flex-1 bg-background pt-20">
          <BlurView intensity={80} tint="dark" className="absolute inset-0" />
          <View className="flex-1 bg-surface/90 rounded-t-[40px] border-t border-white/10 px-6 pt-8">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-h1 font-display">כל ההטבות</Text>
              <Pressable 
                onPress={() => setShowAllRewards(false)}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              >
                <X size={20} color="white" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 pb-20">
                {REWARDS.map((reward) => (
                  <Pressable 
                    key={reward.id}
                    onPress={() => handleRedeem(reward)}
                    className="bg-white/5 border border-white/10 rounded-3xl p-5 flex-row items-center gap-4"
                  >
                    <View 
                      className="w-12 h-12 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: `${reward.color}20` }}
                    >
                      {(() => {
                        const Icon = ICON_MAP[reward.icon] || Gift;
                        return <Icon size={24} color={reward.color} />;
                      })()}
                    </View>
                    <View className="flex-1 items-start">
                      <Text className="text-white font-bold text-[16px] text-left">{reward.title}</Text>
                      <Text className="text-textMuted text-[12px] text-left" numberOfLines={1}>{reward.description}</Text>
                    </View>
                    <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                      <Text className="text-primary text-[12px] font-bold">{reward.points}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Member Card Modal */}
      <Modal
        visible={showMemberCard}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberCard(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <BlurView intensity={20} tint="dark" className="absolute inset-0" />
          <Animated.View 
            entering={FadeInDown.duration(400)}
            className="w-full bg-surfaceLight border border-white/10 rounded-[40px] overflow-hidden"
          >
            <LinearGradient
              colors={[Colors.primary, '#9B1B30']}
              className="p-8 items-center"
            >
              <Text className="text-white/70 text-[12px] font-bold mb-1 uppercase tracking-widest">CinePass Premium</Text>
              <Text className="text-white text-[24px] font-bold mb-6" style={{ fontFamily: 'Rubik-Bold' }}>{user?.name || 'חבר מועדון'}</Text>
              
              <View className="bg-white p-4 rounded-3xl mb-6 shadow-2xl">
                <Image 
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CINEPASS-${user?.id || 'GUEST'}-${user?.name || 'USER'}` }} 
                  className="w-48 h-48"
                  resizeMode="contain"
                />
              </View>
              
              <Text className="text-white/60 text-[12px]">סרוק בקופה לקבלת נקודות והטבות</Text>
            </LinearGradient>
            
            <View className="p-6">
              <View className="flex-row justify-between mb-4">
                <Text className="text-textMuted">מספר חבר</Text>
                <Text className="text-white font-bold">#CP-{user?.id ? user.id.slice(-4).toUpperCase() : '8849'}-2026</Text>
              </View>
              <View className="flex-row justify-between mb-8">
                <Text className="text-textMuted">סטטוס</Text>
                <Text className="text-secondary font-bold">{currentTier}</Text>
              </View>
              
              <Pressable 
                onPress={() => setShowMemberCard(false)}
                className="bg-primary py-4 rounded-2xl items-center active:bg-primary/80"
              >
                <Text className="text-white font-bold text-[16px]">סגירה</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
