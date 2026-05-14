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
import Animated, { 
  FadeInRight, 
  Layout,
  useAnimatedStyle, 
  interpolateColor,
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
  ChevronLeft
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, POSTER_SIZES, BACKDROP_SIZES, Typography } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { type TMDBMovie, getGenreName } from '@/lib/tmdb';
import { useSearch } from '@/hooks/useSearch';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 160;
const GENRE_FILTERS = [28, 12, 16, 35, 80, 27, 10749, 878];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
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
  } = useSearch();

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
          text="קטגוריות" 
          className="text-h2 text-text"
          color={Colors.secondary} 
        />
        <Filter size={20} color={Colors.secondary} />
      </View>
      <View className="flex-row flex-wrap gap-2.5 justify-start">
        <Pressable
          className={`px-5 py-2.5 rounded-2xl border ${activeGenre === null ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-surfaceLight border-white/5'}`}
          onPress={() => handleGenrePress(null)}
        >
          <Text className={`text-[14px] font-bold ${activeGenre === null ? 'text-background' : 'text-textSecondary'}`} style={{ fontFamily: 'Rubik-Bold' }}>הכל</Text>
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
              <ChevronLeft size={18} color={Colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
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
                <Text className="text-textMuted text-[14px] text-right" style={{ fontFamily: 'Rubik-Medium' }}>מצאנו {results.length} תוצאות</Text>
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
          <Animated.View 
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
              placeholder={isAISearch ? "חיפוש חכם (למשל: 'סרט חלל עצוב')" : "חפש סרטים, ז'אנרים או שחקנים..."}
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={handleSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCorrect={false}
              underlineColorAndroid="transparent"
              returnKeyType={isAISearch ? "search" : "search"}
              onSubmitEditing={isAISearch ? executeAISearch : undefined}
              textAlign="right"
              selectionColor={isAISearch ? Colors.secondary : Colors.primary}
              style={{ fontFamily: 'Rubik-Regular' }}
            />
            {query.length > 0 ? (
              <Pressable 
                onPress={clearSearch} 
                className="w-8 h-8 rounded-full bg-white/10 justify-center items-center"
              >
                <X size={16} color={Colors.text} />
              </Pressable>
            ) : (
              <SearchIcon size={22} color={isFocused && !isAISearch ? Colors.primary : Colors.textMuted} />
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
