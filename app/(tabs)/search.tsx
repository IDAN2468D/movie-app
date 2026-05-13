import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import AnimatedRN, { 
  useAnimatedStyle, 
  interpolateColor
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Star, TrendingUp, Clock, Filter, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, POSTER_SIZES, BACKDROP_SIZES } from '@/constants/Theme';
import MarkerHighlight from '@/components/MarkerHighlight';
import { type TMDBMovie, getGenreName } from '@/lib/tmdb';
import { useSearch } from '@/hooks/useSearch';

const { width } = Dimensions.get('window');

const GENRE_FILTERS = [28, 12, 16, 35, 80, 18, 27, 878]; // Action, Adventure, Animation, Comedy, Crime, Drama, Horror, Sci-Fi

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
    <Animated.View style={{ opacity: fadeAnim }}>
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
              className="w-[130px] h-[190px] rounded-lg overflow-hidden bg-surface"
              onPress={() => router.push(`/movie/${item.id}`)}
            >
              <Image 
                source={{ uri: `${POSTER_SIZES.small}${item.poster_path}` }} 
                className="w-full h-full"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                className="absolute bottom-0 start-0 end-0 p-3 h-[45%] justify-end"
              >
                <Text className="text-caption text-text font-bold font-body" numberOfLines={1}>
                  {item.title.length > 18 ? `${item.title.substring(0, 18)}...` : item.title}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        />
      </View>
    </Animated.View>
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
          className={`px-4 py-2.5 rounded-full border border-border ${activeGenre === null ? 'bg-primary border-primary' : 'bg-surfaceLight'}`}
          onPress={() => handleGenrePress(null)}
        >
          <Text className={`text-caption font-semibold font-body ${activeGenre === null ? 'text-background' : 'text-textSecondary'}`}>הכל</Text>
        </Pressable>
        {GENRE_FILTERS.map((genreId) => (
          <Pressable
            key={genreId}
            className={`px-4 py-2.5 rounded-full border border-border ${activeGenre === genreId ? 'bg-primary border-primary' : 'bg-surfaceLight'}`}
            onPress={() => handleGenrePress(genreId)}
          >
            <Text className={`text-caption font-semibold font-body ${activeGenre === genreId ? 'text-background' : 'text-textSecondary'}`}>
              {getGenreName(genreId)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderResultItem = ({ item, index }: { item: TMDBMovie; index: number }) => {
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
        <Pressable
          className="mx-5 mb-5 h-[170px] rounded-xl overflow-hidden bg-surface"
          style={({ pressed }) => [
            {
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5
            },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]}
          onPress={() => router.push(`/movie/${item.id}`)}
        >
          <Image
            source={{ 
              uri: item.backdrop_path 
                ? `${BACKDROP_SIZES.small}${item.backdrop_path}`
                : `${POSTER_SIZES.medium}${item.poster_path}`
            }}
            className="w-full h-full"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.9)']}
            className="absolute inset-0 justify-end p-5"
          >
            <View className="gap-1.5 items-start">
              <View className="flex-row justify-between items-center w-full">
                <Text 
                  className="text-h3 text-white font-bold font-display" 
                  numberOfLines={1}
                >
                  {item.title.length > 18 ? `${item.title.substring(0, 18)}...` : item.title}
                </Text>
                <View className="flex-row items-center gap-1 bg-black/50 px-2.5 py-1 rounded-sm">
                  <Star size={12} color={Colors.primary} fill={Colors.primary} />
                  <Text className="text-label text-primary font-bold font-body">{item.vote_average.toFixed(1)}</Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color={Colors.textSecondary} />
                  <Text className="text-caption text-textSecondary font-body">{item.release_date?.split('-')[0]}</Text>
                </View>
                <View className="w-1 h-1 rounded-full bg-textMuted" />
                <Text className="text-caption text-textSecondary font-body">{getGenreName(item.genre_ids[0])}</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Animated.FlatList
        data={searched ? results : []}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 100 }}>
            {renderGenres()}
            {!searched && renderDiscovery()}
          </View>
        }
        ListEmptyComponent={loading ? (
          <View className="mt-[100px] items-center justify-center">
            <ActivityIndicator size="large" color={isAISearch ? Colors.secondary : Colors.primary} />
            {isAISearch && <Text className="text-caption text-secondary mt-4 font-body">ה-AI מחפש עבורך...</Text>}
          </View>
        ) : searched ? (
          <View className="mt-[100px] items-center justify-center gap-4">
            <Text className="text-[64px] mb-2.5">😕</Text>
            <Text className="text-body text-textSecondary font-body">לא נמצאו תוצאות{query ? ` עבור "${query}"` : ' בקטגוריה זו'}</Text>
          </View>
        ) : null}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Header */}
      <View className="absolute top-0 start-0 end-0 z-50 pb-5 border-b border-white/10 bg-background" style={{ paddingTop: insets.top + 10 }}>
        <View className="px-5">
          <AnimatedRN.View 
            style={[
              inputAnimatedStyle,
              {
                shadowColor: isAISearch ? Colors.secondary : Colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 15,
                elevation: 10,
                transform: [{ scale: isFocused ? 1.02 : 1 }],
                shadowOpacity: isFocused ? 0.3 : 0,
              }
            ]}
            className="flex-row items-center rounded-2xl px-4 h-[60px] border overflow-hidden"
          >
            <Pressable onPress={toggleAIMode} className="p-1">
              <Sparkles size={22} color={isAISearch ? Colors.secondary : Colors.textMuted} />
            </Pressable>
            <TextInput
              className="flex-1 text-body text-text h-12 mx-3 font-body bg-transparent"
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
          </AnimatedRN.View>
        </View>
      </View>
    </View>
  );
}
