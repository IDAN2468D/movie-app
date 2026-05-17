import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated as RNAnimated,
  StyleSheet,
} from 'react-native';
import Reanimated, { 
  FadeInRight, 
  Layout,
  useAnimatedStyle, 
  interpolateColor,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Search as SearchIcon, 
  X, 
  Star, 
  TrendingUp, 
  Clock, 
  Filter, 
  Sparkles, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Mic
} from 'lucide-react-native';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { AIService } from '@/services/AIService';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, POSTER_SIZES, BACKDROP_SIZES, Typography } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { type TMDBMovie, getGenreName } from '@/lib/tmdb';
import { useSearch } from '@/hooks/useSearch';
import AIOrb from '@/components/AIOrb';
import { FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 160;
const GENRE_FILTERS = [28, 12, 16, 35, 80, 27, 10749, 878];

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

// VoiceWave removed in favor of AIOrb

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  
  const {
    query,
    results,
    loading,
    searched,
    popular,
    activeGenre,
    isAISearch,
    scrollY,
    fadeAnim,
    isFocused,
    focusAnim,
    setIsFocused,
    handleSearch,
    executeAISearch,
    toggleAIMode,
    handleGenrePress,
    clearSearch,
    applyVoiceResults,
    manualFilters,
    updateManualFilter,
    clearManualFilters,
  } = useSearch();

  const { isRecording, startRecording, stopRecording } = useVoiceRecording();
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const handleVoicePress = async () => {
    if (isRecording) {
      const base64 = await stopRecording();
      if (base64) {
        setIsVoiceProcessing(true);
        try {
          const filters = await AIService.processVoiceSearch(base64);
          applyVoiceResults(filters);
        } catch (error) {
          console.error('Voice search processing failed', error);
        } finally {
          setIsVoiceProcessing(false);
        }
      }
    } else {
      await startRecording();
    }
  };

  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.1)', isAISearch ? Colors.secondary : Colors.primary]
      ),
      backgroundColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        [Colors.surfaceLight, '#27272A']
      ),
    };
  });

  const renderDiscovery = () => (
    <RNAnimated.View style={{ opacity: fadeAnim }}>
      <View className="mt-6 px-5">
        <View className="flex-row items-center justify-between px-5 mb-5">
          <MarkerHighlight 
            text="חיפושים פופולריים" 
            className="text-h2 text-text"
            color={Colors.primary} 
          />
          <TrendingUp size={20} color={Colors.primary} />
        </View>
        <FlatList
          data={popular}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `pop-${item.id}`}
          contentContainerStyle={{ gap: 12, paddingEnd: 20 }}
          renderItem={({ item }) => (
            <Pressable 
              className="w-[130px] h-[190px] rounded-2xl overflow-hidden bg-surface border border-white/5"
              onPress={() => router.push(`/movie/${item.id}`)}
            >
              <Image 
                source={item.poster_path ? { uri: `${POSTER_SIZES.small}${item.poster_path}` } : require('../../assets/images/poster-placeholder.png')} 
                className="w-full h-full"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                className="absolute bottom-0 start-0 end-0 p-3 h-[50%] justify-end"
              >
                <Text className="text-[13px] text-white font-bold" style={{ fontFamily: 'Rubik-Bold' }} numberOfLines={2}>
                  {item.title}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        />
      </View>
    </RNAnimated.View>
  );

  const renderGenres = () => (
    <View className="mt-6 px-5">
      <View className="flex-row items-center justify-between px-5 mb-5">
        <MarkerHighlight 
          text="קטגוריות וסינון" 
          className="text-h2 text-text"
          color={Colors.secondary} 
        />
        <Pressable 
          onPress={() => setIsFilterVisible(!isFilterVisible)}
          className={`p-2 rounded-full ${isFilterVisible || Object.keys(manualFilters).length > 0 ? 'bg-secondary/20' : 'bg-transparent'}`}
        >
          <Filter size={20} color={isFilterVisible || Object.keys(manualFilters).length > 0 ? Colors.secondary : Colors.textSecondary} />
        </Pressable>
      </View>

      {isFilterVisible && (
        <Reanimated.View entering={FadeInRight.duration(300)} className="mb-6 px-2">
          {/* Release Year */}
          <Text className="text-textSecondary text-[14px] mb-3 text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>שנת יציאה</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-start mb-5">
            {['2025', '2024', '2023', '2022', '2021'].map(year => (
              <Pressable
                key={year}
                className={`px-4 py-2 rounded-xl border ${manualFilters['primary_release_year'] === year ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surfaceLight border-white/5'}`}
                onPress={() => updateManualFilter('primary_release_year', manualFilters['primary_release_year'] === year ? null : year)}
              >
                <Text className={`text-[13px] font-bold ${manualFilters['primary_release_year'] === year ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
                  {year}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Certification / Age Rating */}
          <Text className="text-textSecondary text-[14px] mb-3 text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>דירוג גיל</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-start mb-5">
            {[ {label: 'לכולם', val: 'G'}, {label: 'PG', val: 'PG'}, {label: 'PG-13', val: 'PG-13'}, {label: 'למבוגרים', val: 'R'} ].map(cert => (
              <Pressable
                key={cert.val}
                className={`px-4 py-2 rounded-xl border ${manualFilters['certification'] === cert.val ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surfaceLight border-white/5'}`}
                onPress={() => updateManualFilter('certification', manualFilters['certification'] === cert.val ? null : cert.val)}
              >
                <Text className={`text-[13px] font-bold ${manualFilters['certification'] === cert.val ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
                  {cert.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Minimum Rating */}
          <Text className="text-textSecondary text-[14px] mb-3 text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>דירוג מינימלי</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-start mb-5">
            {[ {label: '8+', val: '8.0'}, {label: '7+', val: '7.0'}, {label: '6+', val: '6.0'} ].map(rating => (
              <Pressable
                key={rating.val}
                className={`px-4 py-2 rounded-xl border flex-row items-center gap-1 ${manualFilters['vote_average.gte'] === rating.val ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surfaceLight border-white/5'}`}
                onPress={() => updateManualFilter('vote_average.gte', manualFilters['vote_average.gte'] === rating.val ? null : rating.val)}
              >
                <Star size={12} color={manualFilters['vote_average.gte'] === rating.val ? Colors.background : Colors.textSecondary} />
                <Text className={`text-[13px] font-bold ${manualFilters['vote_average.gte'] === rating.val ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
                  {rating.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sort By */}
          <Text className="text-textSecondary text-[14px] mb-3 text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>מיין לפי</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-start mb-5">
            {[ 
              {label: 'פופולריות', val: 'popularity.desc'}, 
              {label: 'דירוג', val: 'vote_average.desc'}, 
              {label: 'חדש ביותר', val: 'primary_release_date.desc'} 
            ].map(sort => (
              <Pressable
                key={sort.val}
                className={`px-4 py-2 rounded-xl border ${manualFilters['sort_by'] === sort.val ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surfaceLight border-white/5'}`}
                onPress={() => updateManualFilter('sort_by', manualFilters['sort_by'] === sort.val ? null : sort.val)}
              >
                <Text className={`text-[13px] font-bold ${manualFilters['sort_by'] === sort.val ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
                  {sort.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Original Language */}
          <Text className="text-textSecondary text-[14px] mb-3 text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>שפה מקורית</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-start mb-5">
            {[ {label: 'אנגלית', val: 'en'}, {label: 'עברית', val: 'he'}, {label: 'ספרדית', val: 'es'}, {label: 'צרפתית', val: 'fr'} ].map(lang => (
              <Pressable
                key={lang.val}
                className={`px-4 py-2 rounded-xl border ${manualFilters['language'] === lang.val ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surfaceLight border-white/5'}`}
                onPress={() => updateManualFilter('language', manualFilters['language'] === lang.val ? null : lang.val)}
              >
                <Text className={`text-[13px] font-bold ${manualFilters['language'] === lang.val ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Runtime */}
          <Text className="text-textSecondary text-[14px] mb-3 text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>אורך סרט</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-start mb-5">
            {[ 
              {label: 'קצר', val: 'short'}, 
              {label: 'בינוני', val: 'medium'}, 
              {label: 'ארוך', val: 'long'} 
            ].map(time => (
              <Pressable
                key={time.val}
                className={`px-4 py-2 rounded-xl border ${manualFilters['runtime'] === time.val ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surfaceLight border-white/5'}`}
                onPress={() => updateManualFilter('runtime', manualFilters['runtime'] === time.val ? null : time.val)}
              >
                <Text className={`text-[13px] font-bold ${manualFilters['runtime'] === time.val ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
                  {time.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Vote Count */}
          <Text className="text-textSecondary text-[14px] mb-3 text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>מספר מדרגים</Text>
          <View className="flex-row flex-wrap gap-2.5 justify-start mb-5">
            {[ 
              {label: '100+', val: '100'}, 
              {label: '500+', val: '500'}, 
              {label: '1000+', val: '1000'} 
            ].map(votes => (
              <Pressable
                key={votes.val}
                className={`px-4 py-2 rounded-xl border ${manualFilters['vote_count'] === votes.val ? 'bg-secondary border-secondary shadow-lg shadow-secondary/20' : 'bg-surfaceLight border-white/5'}`}
                onPress={() => updateManualFilter('vote_count', manualFilters['vote_count'] === votes.val ? null : votes.val)}
              >
                <Text className={`text-[13px] font-bold ${manualFilters['vote_count'] === votes.val ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
                  {votes.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {Object.keys(manualFilters).length > 0 && (
            <Pressable onPress={clearManualFilters} className="self-start mt-2">
              <Text className="text-error text-[14px] text-left" style={{ fontFamily: 'Rubik-Medium', textAlign: 'left', writingDirection: 'ltr' }}>נקה סינון</Text>
            </Pressable>
          )}
          <View className="h-[1px] bg-white/10 w-full my-4" />
        </Reanimated.View>
      )}

      <View className="flex-row flex-wrap gap-2.5 justify-start">
        <Pressable
          className={`px-5 py-2.5 rounded-2xl border ${activeGenre === null && Object.keys(manualFilters).length === 0 ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-surfaceLight border-white/5'}`}
          onPress={() => {
            handleGenrePress(null);
            clearManualFilters();
          }}
        >
          <Text className={`text-[14px] font-bold ${activeGenre === null && Object.keys(manualFilters).length === 0 ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>הכל</Text>
        </Pressable>
        {GENRE_FILTERS.map((genreId: number) => (
          <Pressable
            key={genreId}
            className={`px-5 py-2.5 rounded-2xl border ${activeGenre === genreId ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-surfaceLight border-white/5'}`}
            onPress={() => handleGenrePress(genreId)}
          >
            <Text className={`text-[14px] font-bold ${activeGenre === genreId ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>
              {getGenreName(genreId)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderResultItem = ({ item, index }: { item: TMDBMovie; index: number }) => {
    return (
      <AnimatedPressable
        entering={FadeInRight.delay(index * 50).duration(400)}
        layout={Layout.springify()}
        onPress={() => router.push(`/movie/${item.id}`)}
        className="mx-5 mb-4 overflow-hidden"
        style={{ height: ITEM_HEIGHT, borderRadius: 24 }}
      >
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View className="flex-row flex-1 border border-white/10 rounded-[24px] overflow-hidden">
          {/* Poster - Left side */}
          <View className="w-28 h-full shadow-2xl">
            <Image
              source={item.poster_path ? { uri: `${POSTER_SIZES.small}${item.poster_path}` } : require('../../assets/images/poster-placeholder.png')}
              className="w-full h-full"
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              className="absolute inset-0"
            />
          </View>
          
          {/* Content - Right side */}
          <View className="flex-1 p-4 justify-between items-start">
            <View className="items-start w-full">
              <Text 
                className="text-white text-[18px] text-left font-bold leading-tight" 
                style={{ fontFamily: 'Rubik-Bold' }} 
                numberOfLines={2}
              >
                {item.title}
              </Text>
              
              <View className="flex-row items-center mt-3 gap-2">
                {/* Rating */}
                <View className="flex-row items-center bg-secondary/20 px-2 py-0.5 rounded-lg border border-secondary/20">
                  <Star size={12} color={Colors.secondary} fill={Colors.secondary} />
                  <Text className="text-secondary text-[12px] font-bold ms-1" style={{ fontFamily: 'Rubik-Medium' }}>
                    {item.vote_average.toFixed(1)}
                  </Text>
                </View>
                
                {/* Year */}
                <View className="flex-row items-center bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                  <Calendar size={12} color={Colors.textSecondary} />
                  <Text className="text-textSecondary text-[12px] ms-1" style={{ fontFamily: 'Rubik-Regular' }}>
                    {item.release_date?.split('-')[0]}
                  </Text>
                </View>
              </View>

              <Text className="text-textMuted text-[12px] mt-2 text-left" style={{ fontFamily: 'Rubik-Regular' }}>
                {getGenreName(item.genre_ids[0])}
              </Text>
            </View>

            <View className="flex-row justify-between items-center w-full">
              <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                 <Text className="text-primary text-[11px] font-bold" style={{ fontFamily: 'Rubik-Bold' }}>פרטים נוספים</Text>
              </View>
              <ChevronLeft size={18} color={Colors.textMuted} />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Visual Accents */}
      <View className="absolute top-0 right-0 w-[300] h-[300] bg-primary/5 rounded-full blur-[100px]" />
      <View className="absolute bottom-0 left-0 w-[250] h-[250] bg-secondary/5 rounded-full blur-[80px]" />

      <RNAnimated.FlatList
        data={searched ? results : []}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.id.toString()}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 100 }}>
            {renderGenres()}
            {!searched && renderDiscovery()}
            {searched && results.length > 0 && (
              <View className="px-10 mt-6 mb-2">
                <Text className="text-textMuted text-[14px] text-left" style={{ fontFamily: 'Rubik-Medium' }}>מצאנו {results.length} תוצאות</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={loading ? (
          <View className="mt-[100px] items-center justify-center">
            <ActivityIndicator size="large" color={isAISearch ? Colors.secondary : Colors.primary} />
            {isAISearch && <Text className="text-[14px] text-secondary mt-4 font-body" style={{ fontFamily: 'Rubik-Medium' }}>ה-AI מחפש עבורך...</Text>}
          </View>
        ) : searched ? (
          <View className="mt-[100px] items-center justify-center gap-4">
            <Text className="text-[64px] mb-2.5">😕</Text>
            <Text className="text-[16px] text-textSecondary text-center px-10" style={{ fontFamily: 'Rubik-Regular' }}>
              לא נמצאו תוצאות{query ? ` עבור "${query}"` : ' בקטגוריה זו'}
            </Text>
          </View>
        ) : null}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Header */}
      <View className="absolute top-0 start-0 end-0 z-50 pb-5 border-b border-white/10" style={{ paddingTop: insets.top + 10 }}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View className="px-5">
        <Reanimated.View 
            style={[
              inputAnimatedStyle,
              {
                shadowColor: isAISearch ? Colors.secondary : Colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 15,
                elevation: 10,
                transform: [{ scale: isFocused ? 1.01 : 1 }],
                shadowOpacity: isFocused ? 0.3 : 0,
              }
            ]}
            className="flex-row items-center rounded-[20px] px-4 h-[60px] border overflow-hidden"
          >
            <Pressable onPress={toggleAIMode} className="p-1">
              <Sparkles size={22} color={isAISearch ? Colors.secondary : Colors.textMuted} />
            </Pressable>
            <TextInput
              className="flex-1 text-[16px] text-white h-12 mx-3 font-body bg-transparent"
              placeholder={isRecording ? "מקשיב..." : isVoiceProcessing ? "מעבד קול..." : isAISearch ? "חיפוש חכם (למשל: 'סרט חלל עצוב')" : "חפש סרטים, ז'אנרים או שחקנים..."}
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={handleSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCorrect={false}
              underlineColorAndroid="transparent"
              returnKeyType={isAISearch ? "search" : "search"}
              onSubmitEditing={isAISearch ? executeAISearch : undefined}
              textAlign="left"
              selectionColor={isAISearch ? Colors.secondary : Colors.primary}
              style={{ fontFamily: 'Rubik-Regular' }}
              editable={!isRecording && !isVoiceProcessing}
            />
            
            <View className="flex-row items-center gap-2">
              {query.length > 0 && !isRecording ? (
                <Pressable 
                  onPress={clearSearch} 
                  className="w-8 h-8 rounded-full bg-white/10 justify-center items-center"
                >
                  <X size={16} color={Colors.text} />
                </Pressable>
              ) : (
                <Pressable 
                  onPress={handleVoicePress}
                  className={`w-10 h-10 rounded-full justify-center items-center ${isRecording ? 'bg-primary' : 'bg-white/5'}`}
                >
                  {isRecording && <View className="absolute inset-0 items-center justify-center"><View className="w-8 h-8 bg-white/20 rounded-full animate-pulse" /></View>}
                  {isVoiceProcessing ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Mic size={20} color={isRecording ? 'white' : (isFocused && !isAISearch ? Colors.primary : Colors.textMuted)} />
                  )}
                </Pressable>
              )}
              {query.length === 0 && !isRecording && (
                <SearchIcon size={22} color={isFocused && !isAISearch ? Colors.primary : Colors.textMuted} />
              )}
            </View>
          </Reanimated.View>
        </View>
      </View>

      {(isRecording || isVoiceProcessing) && (
        <Reanimated.View 
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          className="absolute inset-0 z-[100] items-center justify-center"
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <AIOrb isRecording={isRecording} isProcessing={isVoiceProcessing} size={160} />
          <Reanimated.Text 
            entering={FadeIn.delay(200)}
            className="text-white text-[20px] mt-12 font-bold text-center px-10" 
            style={{ fontFamily: 'Rubik-Bold' }}
          >
            {isRecording ? "אני מקשיב... ספר לי איזה סרט מתחשק לך לראות" : "מעבד את הבקשה שלך..."}
          </Reanimated.Text>
          
          {isRecording && (
            <Reanimated.View 
              entering={FadeInDown.delay(50)}
              layout={Layout.springify()}
              style={[
                { width: '48%', marginBottom: 16 },
                inputAnimatedStyle,
              ]}
            >
              <Pressable onPress={handleVoicePress} className="bg-primary/20 px-10 py-4 rounded-[24px] border border-primary/30">
                <Text className="text-primary font-bold text-[16px]" style={{ fontFamily: 'Rubik-Bold' }}>סיום והקלטה</Text>
              </Pressable>
            </Reanimated.View>
          )}
        </Reanimated.View>
      )}
    </View>
  );
}
