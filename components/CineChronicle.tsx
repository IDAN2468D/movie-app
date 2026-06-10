import React from 'react';
import { View, Text, Image, Dimensions, Pressable, StyleSheet, I18nManager } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Calendar, Clock, Ticket } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import type { BookedTicket } from '@/store/useBookingStore';
import { getImageSource, handleImageError } from '@/utils/ImageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const SPACING = 16;
const SPACER_WIDTH = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface CineChronicleProps {
  tickets: BookedTicket[];
  onPressTicket: (ticket: BookedTicket) => void;
}

const PerforationRow = () => {
  const holesCount = Math.floor(CARD_WIDTH / 18);
  const holes = Array.from({ length: holesCount });
  return (
    <View className="flex-row justify-between px-3 py-1 bg-black/80">
      {holes.map((_, i) => (
        <View key={i} className="w-2.5 h-2.5 bg-[#09090B] rounded-[2px] border border-white/5" />
      ))}
    </View>
  );
};

export default function CineChronicle({ tickets, onPressTicket }: CineChronicleProps) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Since RTL is forced, the scroll coordinates might be mirrored.
  // Reanimated horizontal scroll works automatically, but we adjust the multiplier just in case.
  const isRTL = I18nManager.isRTL;
  const rtlMultiplier = isRTL ? -1 : 1;

  // Add spacers at the beginning and end of the array to allow full centering of the first/last items
  const data = [
    { id: 'left-spacer', isSpacer: true } as any,
    ...tickets,
    { id: 'right-spacer', isSpacer: true } as any,
  ];

  return (
    <View className="py-6">
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: 0,
        }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        className="flex-row"
      >
        {data.map((item, index) => {
          if (item.isSpacer) {
            return (
              <View
                key={item.id}
                style={{ width: SPACER_WIDTH - (SPACING / 2) }}
              />
            );
          }

          // Calculate offset relative to viewport center
          const itemIndex = index - 1; // Subtract 1 for the leading spacer

          const cardStyle = useAnimatedStyle(() => {
            const indexOffset = itemIndex * (CARD_WIDTH + SPACING);
            const relativePosition = scrollX.value * rtlMultiplier - indexOffset;

            // Perspective rotation on Y-axis as cards move away from center
            const rotateY = interpolate(
              relativePosition,
              [-(CARD_WIDTH + SPACING), 0, CARD_WIDTH + SPACING],
              [35 * rtlMultiplier, 0, -35 * rtlMultiplier],
              Extrapolate.CLAMP
            );

            const scale = interpolate(
              relativePosition,
              [-(CARD_WIDTH + SPACING), 0, CARD_WIDTH + SPACING],
              [0.86, 1.0, 0.86],
              Extrapolate.CLAMP
            );

            const opacity = interpolate(
              relativePosition,
              [-(CARD_WIDTH + SPACING), 0, CARD_WIDTH + SPACING],
              [0.6, 1.0, 0.6],
              Extrapolate.CLAMP
            );

            const skewY = interpolate(
              relativePosition,
              [-(CARD_WIDTH + SPACING), 0, CARD_WIDTH + SPACING],
              [-3, 0, 3],
              Extrapolate.CLAMP
            );

            return {
              transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` },
                { scale },
                { skewY: `${skewY}deg` },
              ],
              opacity,
            };
          });

          return (
            <View
              key={item.id || item._id}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginHorizontal: SPACING / 2,
              }}
            >
              <Pressable onPress={() => onPressTicket(item)} className="flex-1">
                <Animated.View
                  style={[cardStyle, styles.filmFrame]}
                  className="flex-1 bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                  {/* Top Film Strip Perforations */}
                  <PerforationRow />

                  {/* Frame Content */}
                  <View className="flex-1 relative bg-black">
                    {item.moviePoster ? (
                      <Image
                        source={getImageSource(item.moviePoster, 'poster', 'large')}
                        className="absolute inset-0 w-full h-full opacity-60"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="absolute inset-0 bg-surfaceLight items-center justify-center">
                        <Ticket size={48} color={Colors.textMuted} />
                      </View>
                    )}

                    {/* Gradient Overlay */}
                    <View className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

                    {/* Card Info Overlay */}
                    <View className="absolute bottom-4 left-4 right-4 z-10 items-start">
                      <Text
                        style={{ fontFamily: 'Rubik-Bold' }}
                        className="text-white text-lg font-bold mb-2 text-left"
                        numberOfLines={2}
                      >
                        {item.movieTitle}
                      </Text>

                      <View className="flex-row items-center gap-2 mb-2">
                        <Calendar size={12} color={Colors.secondary} />
                        <Text style={{ fontFamily: 'Rubik-Regular' }} className="text-white/70 text-xs">
                          {item.date}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2 mb-3">
                        <Clock size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={{ fontFamily: 'Anton-Regular' }} className="text-white/60 text-xs">
                          {item.showtime?.time} • {item.showtime?.hall}
                        </Text>
                      </View>

                      <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                        <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-primary text-[10px] font-bold">
                          {item.seats?.length} כרטיסים
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Film Strip Perforations */}
                  <PerforationRow />
                </Animated.View>
              </Pressable>
            </View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filmFrame: {
    backfaceVisibility: 'hidden',
  },
});
