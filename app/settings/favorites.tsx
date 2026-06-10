import React from 'react';
import { View, Text, Pressable, ScrollView, Image, I18nManager } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, ChevronLeft, Heart, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors, Typography, POSTER_SIZES } from '@/constants/Theme';
import { cssInterop } from 'react-native-css-interop';
import { useFavorites } from '@/hooks/useFavorites';

cssInterop(BlurView, { className: 'style' });

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { movies, isLoading: loading, goBack } = useFavorites();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable onPress={goBack} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10">
          {I18nManager.isRTL ? <ChevronRight size={24} color={Colors.text} /> : <ChevronLeft size={24} color={Colors.text} />}
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">
            מועדפים
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        {loading ? (
          <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'center' }]} className="text-white/50 mt-10">
            טוען מועדפים...
          </Text>
        ) : movies.length === 0 ? (
          <View className="items-center mt-10">
            <Heart size={48} color="rgba(255,255,255,0.2)" />
            <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'center' }]} className="text-white/50 mt-4">
              אין מועדפים ברשימה שלך
            </Text>
          </View>
        ) : (
          movies.map((movie) => (
            <Pressable 
              key={movie.id} 
              onPress={() => router.push(`/movie/${movie.id}`)}
              className="flex-row items-center p-3 mb-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <Image 
                source={{ uri: `${POSTER_SIZES.small}${movie.poster_path}` }} 
                className="w-16 h-24 rounded-xl" 
                resizeMode="cover" 
              />
              <View className="flex-1 ms-4 justify-center">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 18, color: 'white', marginBottom: 6 }}>{movie.title}</Text>
                <View className="flex-row items-center gap-1.5">
                  <Star size={14} color="#FBBF24" fill="#FBBF24" />
                  <Text style={{ fontFamily: 'Anton-Regular', fontSize: 16, color: '#FBBF24', marginTop: 2 }}>{movie.vote_average.toFixed(1)}</Text>
                </View>
              </View>
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Heart size={20} color={Colors.primary} fill={Colors.primary} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
