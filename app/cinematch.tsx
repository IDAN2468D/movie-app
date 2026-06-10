import React from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  Animated,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Theme';
import { useCineMatchScreen } from '@/hooks/useCineMatchScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;

export default function CineMatchScreen() {
  const insets = useSafeAreaInsets();
  const {
    isLoading, remainingMovies, isGroupMode, inRoom, roomId, participants, lastMatchMovie,
    roomInput, setRoomInput, errorText, showMatchModal,
    panResponder, nextCardOpacity, nextCardScale, getCardStyle, likeOpacity, dislikeOpacity,
    swipeRight, swipeLeft, setGroupMode, handleCreateRoom, handleJoinRoom, handleResetSession,
    handleLeaveRoom, handleCloseMatchModal, handleBookMatch, goBack,
  } = useCineMatchScreen();

  return (
    <View className="flex-1 bg-background">
      {/* Background Cinematic Gradient */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={['#1F0307', '#0A0102', '#000000']}
          className="absolute inset-0"
        />
      </View>

      {/* Top Custom Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-6 pb-4 flex-row items-center justify-between z-10"
      >
        <Pressable
          onPress={goBack}
          className="w-10 h-10 rounded-full border border-white/10 bg-surfaceLight/40 items-center justify-center"
        >
          <Ionicons name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"} size={20} color="white" />
        </Pressable>

        <Text className="text-white text-xl font-bold font-assistant text-center">
          ✨ סיינמאץ' AI
        </Text>

        <Pressable
          onPress={handleResetSession}
          className="w-10 h-10 rounded-full border border-white/10 bg-surfaceLight/40 items-center justify-center"
        >
          <Ionicons name="refresh" size={18} color="white" />
        </Pressable>
      </View>

      {/* Mode Selector (Solo vs Group) */}
      <View className="px-6 mb-4 flex-row justify-center gap-4 z-10">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setGroupMode(false);
          }}
          className={`px-6 py-2.5 rounded-full border ${
            !isGroupMode
              ? 'bg-primary border-primary'
              : 'bg-surfaceLight/40 border-white/10'
          }`}
        >
          <Text className="text-white font-assistant font-bold text-sm">
            👤 סולו
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setGroupMode(true);
          }}
          className={`px-6 py-2.5 rounded-full border ${
            isGroupMode
              ? 'bg-primary border-primary'
              : 'bg-surfaceLight/40 border-white/10'
          }`}
        >
          <Text className="text-white font-assistant font-bold text-sm">
            👥 קבוצתי
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-white/60 font-assistant text-sm mt-4 text-center">
              טוען סרטים מסינבוק...
            </Text>
          </View>
        ) : isGroupMode && !inRoom ? (
          /* Group Setup Form */
          <View className="mx-6 p-6 rounded-3xl border border-white/10 bg-surfaceLight/20 overflow-hidden">
            <BlurView intensity={30} tint="dark" className="absolute inset-0" />
            <View className="z-10">
              <Text className="text-white text-xl font-bold font-assistant text-left mb-2">
                👥 ערב סרטים קבוצתי
              </Text>
              <Text className="text-white/60 text-xs text-left font-assistant leading-5 mb-6">
                צרו חדר או הצטרפו לחדר קיים. המערכת תסנכרן את הבחירות שלכם ותציג התאמה ברגע שכולם יחליקו ימינה על אותו סרט!
              </Text>

              {/* Create Room CTA */}
              <Pressable
                onPress={handleCreateRoom}
                className="rounded-2xl overflow-hidden mb-6"
              >
                <LinearGradient
                  colors={[Colors.primary, '#9B1B30']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 items-center justify-center"
                >
                  <Text className="text-white font-bold font-assistant text-sm">
                    🚪 יצירת חדר סרטים חדש
                  </Text>
                </LinearGradient>
              </Pressable>

              <View className="flex-row items-center justify-center gap-4 mb-6">
                <View className="flex-1 h-[1px] bg-white/10" />
                <Text className="text-white/40 font-assistant text-xs">או</Text>
                <View className="flex-1 h-[1px] bg-white/10" />
              </View>

              {/* Join Room Input */}
              <Text className="text-white/80 font-assistant text-sm text-left mb-2">
                הצטרפו לחדר קיים:
              </Text>
              <View className="flex-row gap-3 mb-2">
                <TextInput
                  value={roomInput}
                  onChangeText={setRoomInput}
                  placeholder="קוד חדר (לדוגמה: 1234)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-left font-assistant text-sm focus:border-primary"
                />
                <Pressable
                  onPress={handleJoinRoom}
                  className="px-6 py-3 rounded-2xl bg-white/10 border border-white/10 items-center justify-center"
                >
                  <Text className="text-white font-bold font-assistant text-sm">
                    הצטרף
                  </Text>
                </Pressable>
              </View>

              {errorText ? (
                <Text className="text-primary font-assistant text-xs text-left mt-1">
                  ⚠️ {errorText}
                </Text>
              ) : null}
            </View>
          </View>
        ) : isGroupMode && inRoom && remainingMovies.length > 0 ? (
          /* Inside Group Active State Banner */
          <View className="mx-6 mb-4 p-4 rounded-2xl border border-white/10 bg-surfaceLight/10 flex-row justify-between items-center z-10 overflow-hidden">
            <BlurView intensity={20} tint="dark" className="absolute inset-0" />
            <View className="flex-1 z-10">
              <Text className="text-white font-bold font-assistant text-xs text-left">
                🍿 חדר פעיל: {roomId}
              </Text>
              <Text className="text-white/60 font-assistant text-[10px] text-left mt-0.5">
                {participants} משתתפים מחוברים כעת
              </Text>
            </View>
            <Pressable
              onPress={handleLeaveRoom}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 z-10"
            >
              <Text className="text-white/60 font-assistant text-[10px]">
                צא מהחדר
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Swipe Stack Section */}
        {!isLoading && remainingMovies.length > 0 && (!isGroupMode || inRoom) ? (
          <View className="items-center justify-center flex-1 py-4">
            <View
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
              className="relative items-center justify-center"
            >
              {remainingMovies
                .slice(0, 2)
                .reverse()
                .map((movie, index, arr) => {
                  const isTopCard = index === arr.length - 1;
                  const posterUrl = movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : 'https://images.unsplash.com/photo-1542204113-e93a434de541?w=500';

                  return (
                    <Animated.View
                      key={movie.id}
                      {...(isTopCard ? panResponder.panHandlers : {})}
                      className="absolute rounded-3xl overflow-hidden border border-white/10 bg-surfaceLight/30"
                      style={[
                        isTopCard ? getCardStyle() : {
                          opacity: nextCardOpacity,
                          transform: [{ scale: nextCardScale }],
                        },
                        {
                          width: CARD_WIDTH,
                          height: CARD_HEIGHT,
                          zIndex: isTopCard ? 5 : 1,
                        }
                      ]}
                    >
                      <Image
                        source={{ uri: posterUrl }}
                        className="w-full h-full object-cover"
                        resizeMode="cover"
                      />

                      {/* Dark overlay for text clarity */}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        className="absolute inset-x-0 bottom-0 h-48 justify-end p-6"
                      >
                        <Text className="text-white text-2xl font-bold font-assistant text-left mb-1">
                          {movie.title}
                        </Text>
                        <View className="flex-row items-center justify-start gap-3 mb-2">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text className="text-white font-bold font-assistant text-xs">
                              {movie.vote_average.toFixed(1)}
                            </Text>
                          </View>
                          <Text className="text-white/40 font-assistant text-xs">|</Text>
                          <Text className="text-white/60 font-assistant text-xs">
                            {movie.release_date ? movie.release_date.split('-')[0] : 'חדש'}
                          </Text>
                        </View>
                        <Text
                          numberOfLines={2}
                          className="text-white/70 text-xs font-assistant text-left leading-5"
                        >
                          {movie.overview}
                        </Text>
                      </LinearGradient>

                      {/* Right/Like feedback overlay */}
                      {isTopCard && (
                        <Animated.View
                          style={{ opacity: likeOpacity }}
                          className="absolute top-8 right-8 border-2 border-emerald-500 bg-emerald-500/20 px-6 py-2 rounded-2xl rotate-[15deg]"
                        >
                          <Text className="text-emerald-500 font-bold font-assistant text-lg">
                            אהבתי 👍
                          </Text>
                        </Animated.View>
                      )}

                      {/* Left/Dislike feedback overlay */}
                      {isTopCard && (
                        <Animated.View
                          style={{ opacity: dislikeOpacity }}
                          className="absolute top-8 left-8 border-2 border-rose-500 bg-rose-500/20 px-6 py-2 rounded-2xl rotate-[-15deg]"
                        >
                          <Text className="text-rose-500 font-bold font-assistant text-lg">
                            פחות 👎
                          </Text>
                        </Animated.View>
                      )}
                    </Animated.View>
                  );
                })}
            </View>

            {/* Quick action buttons below cards */}
            <View className="flex-row justify-center gap-6 mt-8">
              <Pressable
                onPress={swipeLeft}
                className="w-14 h-14 rounded-full border border-rose-500/20 bg-rose-500/10 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="#EF4444" />
              </Pressable>
              <Pressable
                onPress={swipeRight}
                className="w-14 h-14 rounded-full border border-emerald-500/20 bg-emerald-500/10 items-center justify-center"
              >
                <Ionicons name="heart" size={26} color="#10B981" />
              </Pressable>
            </View>
          </View>
        ) : !isLoading && remainingMovies.length === 0 ? (
          /* Empty / Finished State */
          <View className="flex-1 items-center justify-center mx-6 py-12 rounded-3xl border border-white/10 bg-surfaceLight/10 overflow-hidden">
            <BlurView intensity={30} tint="dark" className="absolute inset-0" />
            <View className="z-10 items-center px-6">
              <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center border border-primary/30 mb-6">
                <Text className="text-3xl">🎬</Text>
              </View>
              <Text className="text-white text-xl font-bold font-assistant text-center mb-2">
                זהו, עברתם על כל הסרטים!
              </Text>
              <Text className="text-white/60 text-xs text-center font-assistant leading-5 mb-8">
                נכון לעכשיו אין סרטים חדשים להציג. תוכלו לאפס את ההיסטוריה ולהתחיל מחדש או לחזור לדף הבית.
              </Text>

              <Pressable
                onPress={handleResetSession}
                className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 items-center justify-center mb-4"
              >
                <Text className="text-white font-bold font-assistant text-sm">
                  🔄 התחל מחדש
                </Text>
              </Pressable>

              <Pressable
                onPress={goBack}
                className="w-full py-4 rounded-2xl bg-primary items-center justify-center"
              >
                <Text className="text-white font-bold font-assistant text-sm">
                  🏠 חזרה למסך הבית
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Matches Celebration Modal */}
      <Modal
        visible={showMatchModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMatchModal}
      >
        <View className="flex-1 bg-black/85 items-center justify-center">
          <View
            style={{ width: SCREEN_WIDTH * 0.85 }}
            className="rounded-3xl border border-white/10 bg-surfaceLight/35 p-6 items-center overflow-hidden"
          >
            <BlurView intensity={30} tint="dark" className="absolute inset-0" />

            <View className="z-10 items-center w-full">
              <View className="w-14 h-14 rounded-full bg-primary/20 items-center justify-center border border-primary/30 mb-4 animate-bounce">
                <Text className="text-2xl">🍿</Text>
              </View>

              <Text className="text-white text-2xl font-bold font-assistant text-center mb-1">
                יש לנו סיינמאץ'! 🍿
              </Text>
              <Text className="text-white/60 text-xs font-assistant text-center mb-6">
                מצאתם סרט שכולכם רוצים לראות!
              </Text>

              {lastMatchMovie ? (
                <View className="w-full items-center">
                  <View className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 mb-4">
                    <Image
                      source={{
                        uri: lastMatchMovie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${lastMatchMovie.poster_path}`
                          : 'https://images.unsplash.com/photo-1542204113-e93a434de541?w=500',
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <Text className="text-white text-xl font-bold font-assistant text-center mb-2">
                    {lastMatchMovie.title}
                  </Text>
                  <View className="flex-row items-center justify-center gap-1 mb-6">
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text className="text-white font-bold font-assistant text-xs">
                      {lastMatchMovie.vote_average.toFixed(1)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Book Ticket CTA */}
              <Pressable
                onPress={handleBookMatch}
                className="w-full rounded-2xl overflow-hidden mb-3"
              >
                <LinearGradient
                  colors={[Colors.primary, '#9B1B30']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 items-center justify-center"
                >
                  <Text className="text-white font-bold font-assistant text-sm">
                    🎟️ הזמן כרטיסים עכשיו
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Continue Swiping Button */}
              <Pressable
                onPress={handleCloseMatchModal}
                className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 items-center justify-center"
              >
                <Text className="text-white/80 font-bold font-assistant text-sm">
                  המשך להחליק
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
