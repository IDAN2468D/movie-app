import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  I18nManager,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Heart,
  Trash2,
  Award,
  ChevronDown,
  ChevronUp,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react-native';

import { useReviewStore } from '@/store/useReviewStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors, Typography } from '@/constants/Theme';

// Custom spring configuration from CineBook rules
const SpringPresets = {
  organic: {
    damping: 15,
    stiffness: 120,
    mass: 1.0,
  },
  snappy: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  },
  slowBouncy: {
    damping: 18,
    stiffness: 90,
    mass: 1.2,
  }
};

interface MovieReviewsProps {
  movieId: number;
  themeColors: {
    primary: string;
    secondary: string;
  };
}

export default function MovieReviews({ movieId, themeColors }: MovieReviewsProps) {
  const { reviews, stats, isLoading, error, fetchReviews, addReview, toggleLike, deleteReview } = useReviewStore();
  const { user, isAuthenticated } = useAuthStore();
  
  // Local states
  const [showComposer, setShowComposer] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch reviews on mount or when movieId changes
  useEffect(() => {
    fetchReviews(movieId);
  }, [movieId]);

  // Handle star selection with haptic feedback
  const handleSelectStar = (selectedRating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(selectedRating);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!content.trim()) {
      setSubmitError('אנא כתוב תוכן לביקורת');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await addReview(movieId, rating, content, isSpoiler);
      if (res.success) {
        setContent('');
        setIsSpoiler(false);
        setRating(5);
        setShowComposer(false);
      } else {
        setSubmitError(res.message || 'שגיאה בשליחת הביקורת');
      }
    } catch (err) {
      setSubmitError('שגיאת חיבור לשרת');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user has already reviewed the movie
  const hasUserReviewed = reviews.some(
    (review) => review.userId === (user?.id || user?._id)
  );

  return (
    <View className="mt-8 mb-10 w-full" style={{ alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }}>
      {/* Title */}
      <View className="w-full flex-row items-center justify-between mb-4 px-1" style={{ flexDirection: 'row-reverse' }}>
        <View className="flex-row items-center gap-3" style={{ flexDirection: 'row-reverse' }}>
          <View style={{ backgroundColor: `${themeColors.primary}33` }} className="p-2 rounded-xl">
            <MessageSquare size={20} color={themeColors.primary} />
          </View>
          <Text className="text-h2 text-white font-display">ביקורות וקהילה</Text>
        </View>
        
        {isAuthenticated && !hasUserReviewed && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowComposer(!showComposer);
            }}
            className="px-4 py-2 rounded-full overflow-hidden border border-white/10"
            style={{ backgroundColor: showComposer ? 'rgba(255,255,255,0.05)' : `${themeColors.primary}20` }}
          >
            <View className="flex-row items-center gap-1.5" style={{ flexDirection: 'row-reverse' }}>
              {showComposer ? (
                <ChevronUp size={16} color="white" />
              ) : (
                <ChevronDown size={16} color={themeColors.primary} />
              )}
              <Text className="text-caption font-bold" style={{ color: showComposer ? 'white' : themeColors.primary }}>
                {showComposer ? 'ביטול' : 'כתוב ביקורת'}
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Review Composer Form */}
      {showComposer && (
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          exiting={FadeOut.duration(200)}
          className="w-full mb-6 p-6 rounded-[28px] border border-white/10 overflow-hidden bg-surfaceLight/40"
        >
          <BlurView intensity={20} tint="dark" className="absolute inset-0" />
          
          <View className="w-full relative" style={{ alignItems: 'flex-start' }}>
            <View className="flex-row justify-between items-center w-full mb-4" style={{ flexDirection: 'row-reverse' }}>
              <Text className="text-body font-bold text-white">איך היה הסרט?</Text>
              
              {/* Stars input */}
              <View className="flex-row gap-1" style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => handleSelectStar(star)}
                    hitSlop={8}
                  >
                    <Star
                      size={24}
                      color={star <= rating ? Colors.secondary : 'rgba(255,255,255,0.2)'}
                      fill={star <= rating ? Colors.secondary : 'transparent'}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Loyalty points helper text */}
            <View className="flex-row items-center gap-2 mb-4 bg-secondary/10 border border-secondary/20 p-3 rounded-2xl w-full" style={{ flexDirection: 'row-reverse' }}>
              <Award size={18} color={Colors.secondary} />
              <Text className="text-caption font-bold text-secondary flex-1" style={{ textAlign: 'right', writingDirection: 'rtl' }}>
                פרסום ביקורת זו יזכה אותך ב-15 נקודות נאמנות באופן מיידי!
              </Text>
            </View>

            {/* Input field */}
            <TextInput
              multiline
              numberOfLines={4}
              placeholder="כתוב את חוות דעתך על הסרט... (מינימום 10 תווים)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={content}
              onChangeText={setContent}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-body mb-4"
              style={{
                minHeight: 100,
                textAlign: 'right',
                writingDirection: 'rtl',
              }}
            />

            {/* Spoiler Toggle Switch */}
            <View className="flex-row justify-between items-center w-full mb-5" style={{ flexDirection: 'row-reverse' }}>
              <View className="flex-row items-center gap-2" style={{ flexDirection: 'row-reverse' }}>
                <AlertTriangle size={16} color={isSpoiler ? themeColors.primary : 'rgba(255,255,255,0.4)'} />
                <Text className="text-caption text-white/80 font-body">מכיל ספוילרים לסרט?</Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSpoiler(!isSpoiler);
                }}
                className="w-12 h-6 rounded-full p-1"
                style={{ backgroundColor: isSpoiler ? themeColors.primary : 'rgba(255,255,255,0.2)' }}
              >
                <Animated.View 
                  className="w-4 h-4 rounded-full bg-white"
                  style={{
                    alignSelf: isSpoiler ? 'flex-end' : 'flex-start'
                  }}
                />
              </Pressable>
            </View>

            {submitError && (
              <Text className="text-caption text-primary font-bold mb-4 w-full" style={{ textAlign: 'right', writingDirection: 'rtl' }}>
                {submitError}
              </Text>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmitReview}
              disabled={isSubmitting}
              className="w-full rounded-2xl overflow-hidden shadow-lg shadow-primary/30"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
            >
              <LinearGradient
                colors={[themeColors.primary, '#9B1B30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center justify-center flex-row gap-2"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Send size={16} color="white" />
                    <Text className="text-white font-bold text-body font-display">פרסם ביקורת (+15 נקודות)</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Stats Bento Glass Cards */}
      {stats && stats.total > 0 && (
        <View className="w-full flex-row gap-4 mb-6" style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
          {/* Average Rating Bento */}
          <View className="flex-1 bg-surfaceLight/30 border border-white/5 rounded-3xl p-5 items-center justify-center relative overflow-hidden">
            <BlurView intensity={10} tint="dark" className="absolute inset-0" />
            <Text className="text-[10px] text-white/50 font-bold uppercase tracking-widest font-label mb-2">דירוג ממוצע</Text>
            <Text className="text-[44px] text-white font-display mb-1" style={{ lineHeight: 50 }}>
              {stats.average.toFixed(1)}
            </Text>
            <View className="flex-row gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  color={star <= Math.round(stats.average) ? Colors.secondary : 'rgba(255,255,255,0.15)'}
                  fill={star <= Math.round(stats.average) ? Colors.secondary : 'transparent'}
                />
              ))}
            </View>
            <Text className="text-caption text-textSecondary font-body">מתוך {stats.total} ביקורות</Text>
          </View>

          {/* Distribution Chart Bento */}
          <View className="flex-[1.5] bg-surfaceLight/30 border border-white/5 rounded-3xl p-5 justify-between relative overflow-hidden">
            <BlurView intensity={10} tint="dark" className="absolute inset-0" />
            {[5, 4, 3, 2, 1].map((ratingVal) => {
              const count = stats.distribution[ratingVal as 1|2|3|4|5] || 0;
              const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <View 
                  key={ratingVal} 
                  className="flex-row items-center gap-3 w-full" 
                  style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
                >
                  <View className="flex-row items-center gap-1 w-6" style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
                    <Text className="text-caption font-bold text-white/80">{ratingVal}</Text>
                    <Star size={10} color={Colors.secondary} fill={Colors.secondary} />
                  </View>
                  
                  {/* Progress Bar Track */}
                  <View className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <View 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${percent}%`,
                        backgroundColor: percent > 0 ? Colors.secondary : 'transparent' 
                      }} 
                    />
                  </View>
                  
                  <Text className="text-[10px] text-white/40 w-8 font-mono" style={{ textAlign: I18nManager.isRTL ? 'left' : 'right' }}>
                    {Math.round(percent)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Review List */}
      {isLoading ? (
        <View className="w-full py-8 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <View className="w-full py-10 items-center justify-center border border-white/5 rounded-3xl bg-surfaceLight/20 relative overflow-hidden">
          <BlurView intensity={10} tint="dark" className="absolute inset-0" />
          <MessageSquare size={32} color="rgba(255,255,255,0.2)" />
          <Text className="text-body font-bold text-white/60 mt-3 font-body">אין עדיין ביקורות לסרט זה</Text>
          <Text className="text-caption text-white/40 mt-1 font-body">היה הראשון לשתף את דעתך!</Text>
        </View>
      ) : (
        <View className="w-full gap-4">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review._id}
              review={review}
              index={index}
              currentUserId={user?.id || user?._id}
              themeColors={themeColors}
              onToggleLike={() => toggleLike(review._id)}
              onDelete={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                deleteReview(review._id);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Independent review card to manage local state
function ReviewCard({
  review,
  index,
  currentUserId,
  themeColors,
  onToggleLike,
  onDelete,
}: {
  review: any;
  index: number;
  currentUserId?: string;
  themeColors: { primary: string; secondary: string };
  onToggleLike: () => void;
  onDelete: () => void;
}) {
  const isOwnReview = review.userId === currentUserId;
  const isLikedByMe = currentUserId ? review.likes.includes(currentUserId) : false;

  // Spoiler unmasking with Reanimated Shared Value (Premium Spring Gestures/Triggers)
  const isSpoilerUnmasked = useSharedValue(review.isSpoiler ? 0 : 1);
  const [unmaskedState, setUnmaskedState] = useState(!review.isSpoiler);

  // Animated styles for blur shield container
  const shieldAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1 - isSpoilerUnmasked.value, { duration: 300 }),
      transform: [
        { scale: withSpring(isSpoilerUnmasked.value === 0 ? 1 : 0.85, SpringPresets.snappy) }
      ],
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isSpoilerUnmasked.value, { duration: 300 }),
      transform: [
        { scale: withSpring(isSpoilerUnmasked.value === 1 ? 1 : 0.98, SpringPresets.organic) }
      ],
    };
  });

  const handleUnmaskSpoiler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isSpoilerUnmasked.value = 1;
    setUnmaskedState(true);
  };

  // Convert date format dynamically
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify().damping(16)}
      className="w-full bg-surfaceLight/35 border border-white/5 rounded-3xl p-5 relative overflow-hidden"
    >
      <BlurView intensity={15} tint="dark" className="absolute inset-0" />

      {/* Header (Avatar, name, stars, delete icon) */}
      <View 
        className="w-full flex-row items-start justify-between mb-3.5 gap-3" 
        style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
      >
        {/* User profile details */}
        <View 
          className="flex-row items-center gap-3" 
          style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
        >
          {review.userProfileImage ? (
            <Animated.Image
              source={{ uri: review.userProfileImage }}
              className="w-10 h-10 rounded-full border border-white/10"
              resizeMode="cover"
            />
          ) : (
            <View 
              style={{ backgroundColor: `${themeColors.primary}26` }} 
              className="w-10 h-10 rounded-full items-center justify-center border border-white/10"
            >
              <Text style={{ color: themeColors.primary }} className="font-bold text-caption uppercase">
                {review.userName ? review.userName.slice(0, 2) : 'CB'}
              </Text>
            </View>
          )}
          
          <View style={{ alignItems: 'flex-start' }}>
            <Text className="text-body font-bold text-white leading-tight">{review.userName}</Text>
            <Text className="text-[10px] text-white/40 mt-0.5 font-body">{formatDate(review.createdAt)}</Text>
          </View>
        </View>

        {/* Action icons & stars */}
        <View className="items-end gap-1.5">
          <View className="flex-row gap-0.5" style={{ flexDirection: 'row' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={12}
                color={star <= review.rating ? Colors.secondary : 'rgba(255,255,255,0.1)'}
                fill={star <= review.rating ? Colors.secondary : 'transparent'}
              />
            ))}
          </View>

          {isOwnReview && (
            <Pressable
              onPress={onDelete}
              hitSlop={12}
              className="p-1 rounded-lg bg-primary/10 border border-primary/20 mt-1"
            >
              <Trash2 size={12} color={themeColors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Review Content Box (with interactive frosted Blur Shield for Spoilers) */}
      <View className="w-full relative min-h-[50px] justify-center mt-1">
        {review.isSpoiler && !unmaskedState && (
          <Animated.View
            style={[shieldAnimatedStyle, styles.absoluteShield]}
            className="z-10 bg-black/60 rounded-2xl border border-white/10 overflow-hidden items-center justify-center p-4 w-full h-full"
          >
            <BlurView intensity={70} tint="dark" className="absolute inset-0" />
            <View className="items-center w-full" style={{ alignSelf: 'center' }}>
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center border border-primary/30 mb-2">
                <EyeOff size={18} color={themeColors.primary} />
              </View>
              <Text className="text-caption font-bold text-white text-center mb-2 font-display">אזהרת ספוילר!</Text>
              <Pressable
                onPress={handleUnmaskSpoiler}
                className="px-4 py-1.5 rounded-xl border border-white/20 bg-white/10 shadow-sm"
              >
                <Text className="text-[10px] font-bold text-white font-body">הצג ביקורת</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        <Animated.View style={review.isSpoiler ? contentAnimatedStyle : {}}>
          <Text
            className="text-body text-white/80 leading-relaxed font-body"
            style={{
              textAlign: 'right',
              writingDirection: 'rtl',
            }}
          >
            {review.content}
          </Text>
        </Animated.View>
      </View>

      {/* Footer (Community help Likes/Helpfulness toggle) */}
      <View 
        className="w-full flex-row items-center justify-between mt-4 pt-4 border-t border-white/5" 
        style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
      >
        <View 
          className="flex-row items-center gap-1.5" 
          style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
        >
          {review.isSpoiler && (
            <View className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 flex-row items-center gap-1" style={{ flexDirection: 'row-reverse' }}>
              <AlertTriangle size={10} color={themeColors.primary} />
              <Text style={{ color: themeColors.primary }} className="text-[9px] font-bold font-body">ספוילר</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleLike();
          }}
          className={`flex-row items-center gap-2 px-3 py-1.5 rounded-xl border overflow-hidden ${
            isLikedByMe ? 'bg-secondary/10 border-secondary/30' : 'bg-white/5 border-white/5'
          }`}
          style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
        >
          <Heart
            size={12}
            color={isLikedByMe ? Colors.secondary : 'rgba(255,255,255,0.4)'}
            fill={isLikedByMe ? Colors.secondary : 'transparent'}
          />
          <Text 
            className="text-[10px] font-bold font-body" 
            style={{ color: isLikedByMe ? Colors.secondary : 'rgba(255,255,255,0.5)' }}
          >
            {isLikedByMe ? 'עזר לי!' : 'היה לעזר?'} {review.likes.length > 0 ? `(${review.likes.length})` : ''}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absoluteShield: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
