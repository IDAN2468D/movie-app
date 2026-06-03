import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  I18nManager,
  StyleSheet,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import {
  Users,
  User,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Clock,
  X,
  Heart,
  Mail
} from 'lucide-react-native';

import { useSocialStore, IFriend } from '@/store/useSocialStore';
import { Colors, Typography, POSTER_SIZES } from '@/constants/Theme';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const {
    friends,
    searchResults,
    isLoading,
    fetchFriends,
    addFriend,
    removeFriend,
    searchUsers,
    resetSearch
  } = useSocialStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    searchUsers(text);
  };

  const handleAddFriend = async (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await addFriend(email);
    if (res.success) {
      setSuccessMessage(res.message);
      setSearchQuery('');
      resetSearch();
      // Auto clear success message
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      Alert.alert('שגיאה', res.message, [{ text: 'אישור' }]);
    }
  };

  const handleRemoveFriend = (id: string, name: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'הסרת חבר',
      `האם אתה בטוח שברצונך להסיר את ${name} מרשימת החברים שלך?`,
      [
        { text: 'ביטול', style: 'cancel' },
        { 
          text: 'להסיר', 
          style: 'destructive',
          onPress: async () => {
            const res = await removeFriend(id);
            if (res.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      ]
    );
  };

  const toggleExpandFriend = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFriendId(expandedFriendId === id ? null : id);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const isRTL = I18nManager.isRTL;

  return (
    <View className="flex-1 bg-black">
      {/* Background Ambience Glow */}
      <View style={StyleSheet.absoluteFill} className="overflow-hidden pointer-events-none">
        <LinearGradient
          colors={['#1F0510', '#09090B']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View className="absolute w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px]" style={{ top: -50, right: -50 }} />
      </View>

      {/* Header */}
      <View 
        className="flex-row items-center px-5 py-4 border-b border-white/5 relative z-10" 
        style={{ paddingTop: insets.top + 10, flexDirection: 'row-reverse' }}
      >
        <Pressable 
          onPress={goBack} 
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 justify-center items-center"
        >
          <ChevronRight size={22} color="white" style={{ transform: [{ scaleX: isRTL ? 1 : -1 }] }} />
        </Pressable>
        <View className="flex-1 items-end pe-4">
          <Text className="text-h2 text-white font-display text-right" style={{ writingDirection: 'rtl' }}>מועדון חברים וקהילה</Text>
          <Text className="text-white/40 text-[10px] uppercase font-label">CineFriends Club</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Search / Add Friend Container */}
        <Animated.View entering={FadeInUp.duration(600).springify()} className="mb-8">
          <Text className="text-body font-bold text-white mb-3 text-right" style={{ writingDirection: 'rtl' }}>הוסף חבר חדש</Text>
          
          <View className="flex-row items-center bg-surfaceLight/30 border border-white/8 rounded-2xl px-4 py-3 relative overflow-hidden" style={{ flexDirection: 'row-reverse' }}>
            <Search size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="חיפוש לפי אימייל או שם משתמש..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 text-white font-body px-3 text-right"
              style={{ writingDirection: 'rtl' }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearch('')} hitSlop={10}>
                <X size={16} color="rgba(255,255,255,0.5)" />
              </Pressable>
            )}
          </View>

          {/* Success feedback toast */}
          {successMessage && (
            <Animated.View entering={FadeInDown} exiting={FadeOut} className="mt-3 bg-secondary/10 border border-secondary/20 p-3 rounded-xl flex-row items-center gap-2" style={{ flexDirection: 'row-reverse' }}>
              <Sparkles size={16} color={Colors.secondary} />
              <Text className="text-caption font-bold text-secondary flex-1 text-right" style={{ writingDirection: 'rtl' }}>{successMessage}</Text>
            </Animated.View>
          )}

          {/* Search Results Dropdown */}
          {searchQuery.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300)} className="bg-surfaceLight border border-white/10 rounded-2xl mt-2 overflow-hidden shadow-2xl z-20">
              {isLoading ? (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : searchResults.length === 0 ? (
                <View className="p-4 items-center justify-center">
                  <Text className="text-caption text-white/40 font-body">לא נמצאו משתמשים מתאימים</Text>
                </View>
              ) : (
                searchResults.map((result) => (
                  <View 
                    key={result.id} 
                    className="flex-row items-center justify-between p-4 border-b border-white/5 last:border-b-0 w-full"
                    style={{ flexDirection: 'row-reverse' }}
                  >
                    <View className="flex-row items-center gap-3" style={{ flexDirection: 'row-reverse' }}>
                      <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center border border-white/10">
                        <User size={18} color={Colors.primary} />
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text className="text-body font-bold text-white text-right">{result.name}</Text>
                        <Text className="text-[10px] text-white/40 mt-0.5 text-right">{result.email}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleAddFriend(result.email)}
                      className="px-4 py-2 bg-primary rounded-xl"
                    >
                      <Text className="text-white text-caption font-bold font-display">הוסף</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </Animated.View>
          )}
        </Animated.View>

        {/* Info Box Bento */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-8 rounded-3xl overflow-hidden border border-white/8 bg-surfaceLight/25 p-5 relative">
          <BlurView intensity={10} tint="dark" className="absolute inset-0" />
          <View className="flex-row items-center gap-3 mb-2" style={{ flexDirection: 'row-reverse' }}>
            <Award size={20} color={Colors.secondary} />
            <Text className="text-body font-bold text-white text-right" style={{ writingDirection: 'rtl' }}>מועדון חברים חכם</Text>
          </View>
          <Text className="text-caption text-white/60 leading-relaxed text-right" style={{ writingDirection: 'rtl' }}>
            עקבו אחר החברים שלכם כדי לתאם מושבים צמודים, לשתף המלצות סרטים בלחיצה ולראות באילו סרטים הם הכי רוצים לצפות כעת!
          </Text>
        </Animated.View>

        {/* Friends List Title */}
        <View className="flex-row items-center justify-between mb-4 px-1" style={{ flexDirection: 'row-reverse' }}>
          <View className="flex-row items-center gap-2.5" style={{ flexDirection: 'row-reverse' }}>
            <Users size={18} color={Colors.primary} />
            <Text className="text-h3 text-white font-display text-right" style={{ writingDirection: 'rtl' }}>החברים שלי ({friends.length})</Text>
          </View>
        </View>

        {/* List of Friends */}
        {friends.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200)} className="py-12 items-center justify-center border border-white/5 rounded-3xl bg-surfaceLight/10 relative overflow-hidden">
            <BlurView intensity={10} tint="dark" className="absolute inset-0" />
            <Users size={36} color="rgba(255,255,255,0.15)" />
            <Text className="text-body font-bold text-white/50 mt-3 font-body">אין עדיין חברים ברשימה</Text>
            <Text className="text-caption text-white/30 mt-1 font-body">הוסף חברים כדי להתחיל לשתף חוויות!</Text>
          </Animated.View>
        ) : (
          <View className="gap-4">
            {friends.map((friend, index) => {
              const isExpanded = expandedFriendId === friend.id;
              return (
                <Animated.View
                  key={friend.id}
                  entering={FadeInDown.delay(index * 100).springify().damping(16)}
                  className="rounded-3xl border border-white/5 overflow-hidden bg-surfaceLight/35"
                  layout={Layout.springify()}
                >
                  <BlurView intensity={12} tint="dark" className="absolute inset-0" />
                  
                  {/* Friend Base Row */}
                  <Pressable
                    onPress={() => toggleExpandFriend(friend.id)}
                    className="p-5 flex-row items-center justify-between"
                    style={{ flexDirection: 'row-reverse' }}
                  >
                    <View className="flex-row items-center gap-3.5" style={{ flexDirection: 'row-reverse' }}>
                      {friend.profileImage ? (
                        <Image source={{ uri: friend.profileImage }} className="w-12 h-12 rounded-full border border-white/10" resizeMode="cover" />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-secondary/15 items-center justify-center border border-white/10">
                          <Text className="text-secondary font-bold text-base">{friend.name.slice(0, 2)}</Text>
                        </View>
                      )}
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text className="text-body font-bold text-white leading-tight">{friend.name}</Text>
                        <View className="flex-row items-center gap-1.5 mt-1" style={{ flexDirection: 'row-reverse' }}>
                          <Award size={12} color={Colors.secondary} />
                          <Text className="text-[10px] font-bold text-secondary">{friend.loyaltyPoints} נקודות</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-3" style={{ flexDirection: 'row-reverse' }}>
                      <Pressable
                        onPress={() => handleRemoveFriend(friend.id, friend.name)}
                        hitSlop={12}
                        className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center"
                      >
                        <Trash2 size={14} color={Colors.primary} />
                      </Pressable>
                      <View className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
                        {isExpanded ? (
                          <ChevronUp size={16} color="white" />
                        ) : (
                          <ChevronDown size={16} color="white" />
                        )}
                      </View>
                    </View>
                  </Pressable>

                  {/* Expanded activity drawer */}
                  {isExpanded && (
                    <Animated.View 
                      entering={FadeInUp.duration(300)}
                      className="px-5 pb-5 border-t border-white/5 pt-4"
                    >
                      {/* Active Watchlist */}
                      {friend.watchlist && friend.watchlist.length > 0 && (
                        <View className="mb-4 items-end">
                          <View className="flex-row items-center gap-1.5 mb-2.5" style={{ flexDirection: 'row-reverse' }}>
                            <Heart size={12} color={Colors.primary} />
                            <Text className="text-caption font-bold text-white/80">רשימת מעקב של {friend.name}</Text>
                          </View>
                          
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-5 px-5" contentContainerStyle={{ gap: 12, flexDirection: 'row-reverse' }}>
                            {friend.watchlist.map((movie) => (
                              <View key={movie.id} className="w-24 items-center bg-black/20 p-2 rounded-xl border border-white/5">
                                {movie.posterPath ? (
                                  <Image
                                    source={{ uri: `${POSTER_SIZES.small}${movie.posterPath}` }}
                                    className="w-16 h-24 rounded-lg mb-1.5"
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View className="w-16 h-24 bg-white/5 rounded-lg mb-1.5 items-center justify-center">
                                    <Sparkles size={16} color="rgba(255,255,255,0.2)" />
                                  </View>
                                )}
                                <Text className="text-[9px] text-white/90 text-center font-body" numberOfLines={1}>{movie.title}</Text>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {/* Recent Activities */}
                      {friend.recentActivity && friend.recentActivity.length > 0 && (
                        <View className="items-end">
                          <View className="flex-row items-center gap-1.5 mb-2" style={{ flexDirection: 'row-reverse' }}>
                            <Clock size={12} color="rgba(255,255,255,0.4)" />
                            <Text className="text-caption font-bold text-white/50">פעילות קולנועית אחרונה</Text>
                          </View>
                          
                          <View className="w-full gap-2 bg-black/10 rounded-2xl p-3 border border-white/5">
                            {friend.recentActivity.map((activity, idx) => (
                              <View 
                                key={idx} 
                                className="flex-row items-center justify-between py-1 border-b border-white/5 last:border-b-0"
                                style={{ flexDirection: 'row-reverse' }}
                              >
                                <Text className="text-[10px] text-white/80 text-right flex-1 pe-2" style={{ writingDirection: 'rtl' }}>
                                  {activity.action}
                                </Text>
                                <Text className="text-[9px] text-white/30 font-mono">{activity.time}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
