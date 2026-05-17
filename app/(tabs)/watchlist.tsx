import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, Trash2, Star, Play, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, POSTER_SIZES, Typography, Radius } from '@/constants/Theme';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { TMDBMovie } from '@/lib/tmdb';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 170;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { movies, removeFromWatchlist } = useWatchlistStore();

  const handleRemove = (id: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    removeFromWatchlist(id);
  };

  const renderItem = ({ item, index }: { item: TMDBMovie; index: number }) => (
    <AnimatedPressable
      entering={FadeInRight.delay(index * 100).duration(500)}
      layout={Layout.springify()}
      onPress={() => router.push(`/movie/${item.id}`)}
      className="mb-4 mx-5 overflow-hidden"
      style={{ height: ITEM_HEIGHT, borderRadius: 24 }}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View className="flex-row flex-1 border border-white/10 rounded-[24px] overflow-hidden">
        {/* Poster Image - Now on the Left */}
        <View className="w-32 h-full shadow-2xl">
          <Image
            source={{ uri: `${POSTER_SIZES.small}${item.poster_path}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            className="absolute inset-0"
          />
        </View>
        
        {/* Content Area - To the right of the picture */}
        <View className="flex-1 p-4 justify-between items-start">
          <View className="items-start w-full">
            <Text 
              className="text-white text-[20px] text-left font-bold leading-tight" 
              style={{ fontFamily: 'Rubik-Bold' }} 
              numberOfLines={2}
            >
              {item.title}
            </Text>
            
            <View className="flex-row items-center mt-3 gap-3">
              {/* Rating */}
              <View className="flex-row items-center bg-secondary/20 px-2.5 py-1 rounded-lg border border-secondary/30">
                <Star size={14} color={Colors.secondary} fill={Colors.secondary} />
                <Text className="text-secondary text-[13px] font-bold ms-1.5" style={{ fontFamily: 'Rubik-Medium' }}>
                  {item.vote_average.toFixed(1)}
                </Text>
              </View>
              
              {/* Year */}
              <View className="flex-row items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Calendar size={14} color={Colors.textSecondary} />
                <Text className="text-textSecondary text-[13px] ms-1.5" style={{ fontFamily: 'Rubik-Regular' }}>
                  {item.release_date?.split('-')[0]}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between items-center w-full mt-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleRemove(item.id);
              }}
              className="bg-error/10 p-2.5 rounded-2xl border border-error/20"
              style={({ pressed }) => [pressed && { opacity: 0.6, scale: 0.9 }]}
            >
              <Trash2 size={20} color="#ff4444" />
            </Pressable>

            <View className="bg-primary px-5 py-2.5 rounded-2xl shadow-lg shadow-primary/20">
               <Text className="text-background text-[13px] font-bold" style={{ fontFamily: 'Rubik-Bold' }}>צפה עכשיו</Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Visual Accents */}
      <View className="absolute top-[-50] left-[-50] w-[200] h-[200] bg-secondary/5 rounded-full blur-[80px]" />
      <View className="absolute bottom-[100] right-[-100] w-[300] h-[300] bg-primary/5 rounded-full blur-[100px]" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-6">
        <View className="items-start">
          <Text className="text-[32px] text-white text-left font-bold tracking-tight" style={{ fontFamily: 'Rubik-Bold' }}>רשימת צפייה</Text>
          <Text className="text-[15px] text-textSecondary text-left opacity-80" style={{ fontFamily: 'Rubik-Regular' }}>{movies.length} סרטים שאהבת</Text>
        </View>
        <View className="bg-primary/20 p-3.5 rounded-[20px] border border-primary/20">
          <Bookmark size={28} color={Colors.primary} fill={Colors.primary} />
        </View>
      </View>

      {movies.length > 0 ? (
        <Animated.FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 130, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          itemLayoutAnimation={Layout.springify()}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-10">
          <BlurView intensity={15} tint="dark" className="p-12 rounded-[50px] border border-white/10 items-center overflow-hidden">
            <View className="bg-surfaceLight p-10 rounded-[40px] mb-8 shadow-2xl border border-white/5">
              <Bookmark size={72} color={Colors.textMuted} />
            </View>
            <Text className="text-[24px] text-white text-center font-bold" style={{ fontFamily: 'Rubik-Bold' }}>הרשימה ריקה</Text>
            <Text className="text-[16px] text-textSecondary text-center mt-4 leading-6" style={{ fontFamily: 'Rubik-Regular' }}>
              עוד לא הוספת סרטים לרשימת הצפייה שלך.{"\n"}זה הזמן למצוא משהו מעניין!
            </Text>
            
            <Pressable
              onPress={() => router.push('/(tabs)/search')}
              className="mt-12 bg-primary px-12 py-4.5 rounded-2xl shadow-2xl shadow-primary/40"
            >
              <Text className="text-background font-bold text-[18px]" style={{ fontFamily: 'Rubik-Bold' }}>גלה סרטים</Text>
            </Pressable>
          </BlurView>
        </View>
      )}
    </View>
  );
}
