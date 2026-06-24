import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, X, Share2, Plus, MessageSquare, AlertCircle, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useSquadBookingStore } from '@/store/useSquadBookingStore';
import { useAuthStore } from '@/store/useAuthStore';

// Seats layout constants
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const NUMBERS = [1, 2, 3, 4, 5, 6];

export default function CineShareScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(state => state.user);

  const {
    squadCode,
    sessionDetails,
    isLoading,
    error,
    createSquadSession,
    joinSquadSession,
    toggleSquadSeat,
    leaveSquad,
    clearError,
  } = useSquadBookingStore();

  const [inputCode, setInputCode] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  useEffect(() => {
    return () => {
      // Don't auto-leave here in case they just navigated to checkout
    };
  }, []);

  const handleCreate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await createSquadSession({
      movieId: 550, // Fight Club (Dummy Movie ID)
      movieTitle: 'מועדון קרב (Fight Club)',
      moviePoster: '/pB8BM74j7Zna72mK2wR5uTLac55.jpg',
      date: 'היום, 24 ביוני',
      showtimeId: '60c72b2f9b1d8a23d88b4999',
      showtimeTime: '21:30',
      showtimeHall: 'אולם IMAX 4',
    });
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleJoin = async () => {
    if (!inputCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await joinSquadSession(inputCode);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleShare = async () => {
    if (!squadCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `הצטרף לסקוואד שלי ב-CineBook! קוד החדר: ${squadCode}`,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const isSeatLockedByMe = (row: string, num: number) => {
    if (!sessionDetails) return false;
    return sessionDetails.lockedSeats.some(
      s => s.row === row && s.number === num && s.userId === user?.id
    );
  };

  const getSeatLockDetails = (row: string, num: number) => {
    if (!sessionDetails) return null;
    const lock = sessionDetails.lockedSeats.find(s => s.row === row && s.number === num);
    if (!lock) return null;
    const member = sessionDetails.members.find(m => m.userId === lock.userId);
    return {
      color: (member as any)?.colorCode || '#FF1464',
      name: member?.name || 'משתמש',
      isMe: lock.userId === user?.id
    };
  };

  const handleSeatPress = (row: string, num: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSquadSeat(row, num);
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineShare Seating Squad</Text>
          <View className="w-12" />
        </View>

        {error && (
          <View className="bg-primary/10 border border-primary/30 p-3 rounded-2xl flex-row items-center gap-3 mb-6">
            <AlertCircle size={18} color={Colors.primary} />
            <Text style={{ textAlign: 'right', flex: 1 }} className="text-primary text-xs font-semibold">{error}</Text>
            <Pressable onPress={clearError}>
              <X size={16} color="white" />
            </Pressable>
          </View>
        )}

        {/* Create / Join selector */}
        {!squadCode ? (
          <View className="flex-1 justify-center">
            <Animated.View entering={FadeInDown.duration(600).springify()} className="items-center mb-8">
              <View className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 items-center justify-center mb-4">
                <Users size={44} color={Colors.primary} />
              </View>
              <Text style={{ textAlign: 'center' }} className="text-white text-2xl font-bold mb-2">הזמנה קבוצתית בסקוואד</Text>
              <Text style={{ textAlign: 'center' }} className="text-white/60 text-sm">הזמינו חברים ובחרו מושבים ביחד על מפה מסונכרנת בזמן אמת!</Text>
            </Animated.View>

            {/* Tabs */}
            <View className="flex-row-reverse bg-surfaceLight border border-white/5 p-1 rounded-2xl mb-8">
              <Pressable onPress={() => setActiveTab('create')} className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'create' ? 'bg-white/5 border border-white/10' : ''}`}>
                <Text className={`font-semibold ${activeTab === 'create' ? 'text-white' : 'text-white/40'}`}>צור קבוצה חדשה</Text>
              </Pressable>
              <Pressable onPress={() => setActiveTab('join')} className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'join' ? 'bg-white/5 border border-white/10' : ''}`}>
                <Text className={`font-semibold ${activeTab === 'join' ? 'text-white' : 'text-white/40'}`}>הצטרף לקבוצה</Text>
              </Pressable>
            </View>

            {activeTab === 'create' ? (
              <Animated.View entering={FadeInDown.duration(600).springify()}>
                <Pressable onPress={handleCreate} disabled={isLoading} className="rounded-2xl overflow-hidden">
                  <LinearGradient colors={[Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                    {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-bold">פתח סקוואד חדש</Text>}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.duration(600).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6">
                <Text style={{ textAlign: 'right' }} className="text-white text-base font-bold mb-3">קוד הצטרפות</Text>
                <TextInput
                  value={inputCode}
                  onChangeText={setInputCode}
                  placeholder="הקלד קוד קבוצה בן 6 ספרות"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="characters"
                  style={{ textAlign: 'right', fontFamily: 'Rubik-Regular' }}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base mb-4"
                />
                <Pressable onPress={handleJoin} disabled={isLoading} className="py-3 bg-white/5 border border-white/10 rounded-2xl items-center">
                  {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-semibold">הצטרף לסקוואד</Text>}
                </Pressable>
              </Animated.View>
            )}
          </View>
        ) : (
          /* Seating Sync Active Dashboard */
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 gap-6">
            
            {/* Squad details */}
            <Animated.View entering={FadeInDown.duration(600).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-5">
              <View className="flex-row-reverse items-center justify-between mb-3">
                <View>
                  <Text style={{ textAlign: 'right' }} className="text-white text-lg font-bold">{sessionDetails?.movieTitle}</Text>
                  <Text style={{ textAlign: 'right' }} className="text-white/40 text-xs">{sessionDetails?.showtimeHall} • {sessionDetails?.showtimeTime}</Text>
                </View>
                <Pressable onPress={handleShare} className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
                  <Share2 size={18} color={Colors.primary} />
                </Pressable>
              </View>

              <View className="flex-row-reverse items-center gap-1.5 bg-black/30 px-3 py-2 rounded-xl">
                <Text className="text-white/40 text-xs">קוד החדר:</Text>
                <Text className="text-white text-sm font-bold tracking-widest">{squadCode}</Text>
              </View>
            </Animated.View>

            {/* Seating Grid */}
            <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6 items-center">
              <Text className="text-white/40 text-[10px] mb-8 font-bold uppercase tracking-widest">המסך כאן</Text>

              {/* Rows loop */}
              <View className="gap-3 w-full">
                {ROWS.map(row => (
                  <View key={row} className="flex-row items-center justify-center gap-3">
                    <Text className="text-white/30 text-xs w-4 text-center">{row}</Text>
                    {NUMBERS.map(num => {
                      const lock = getSeatLockDetails(row, num);
                      const isMine = lock?.isMe;

                      let seatBg = 'bg-white/5 border border-white/10';
                      let ringColor = 'transparent';

                      if (lock) {
                        seatBg = 'bg-primary/20';
                        ringColor = lock.color;
                      }

                      return (
                        <Pressable
                          key={num}
                          onPress={() => handleSeatPress(row, num)}
                          className={`w-8 h-8 rounded-lg items-center justify-center relative ${seatBg}`}
                        >
                          {lock && (
                            <View 
                              style={{ 
                                position: 'absolute', 
                                borderWidth: 2, 
                                borderColor: ringColor, 
                                borderRadius: 12,
                                width: 38,
                                height: 38,
                                opacity: 0.6
                              }} 
                            />
                          )}
                          <Text className="text-white/60 text-[10px] font-bold">{num}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Active Members */}
            <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-5">
              <View className="flex-row-reverse items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <Users size={16} color={Colors.primary} />
                <Text className="text-white text-sm font-bold">חברי סקוואד מחוברים ({sessionDetails?.members.length})</Text>
              </View>

              <View className="gap-3">
                {sessionDetails?.members.map(member => (
                  <View key={member.userId} className="flex-row-reverse items-center justify-between">
                    <View className="flex-row-reverse items-center gap-3">
                      <View style={{ backgroundColor: (member as any).colorCode || '#FF1464' }} className="w-3 h-3 rounded-full" />
                      <Text className="text-white text-sm font-semibold">{member.name}</Text>
                    </View>
                    <Text className="text-white/40 text-xs">{member.userId === user?.id ? 'אתה' : 'מחובר'}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Leave Squad button */}
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); leaveSquad(); }} className="py-4 bg-white/5 border border-white/10 rounded-2xl items-center mb-10">
              <Text className="text-red-500 text-base font-bold">עזוב קבוצה</Text>
            </Pressable>
          </ScrollView>
        )}

      </View>
    </View>
  );
}
