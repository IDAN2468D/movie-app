import React from 'react';
import { View, Text, Dimensions, Pressable } from 'react-native';
import Svg, { Rect, G, Path, Circle } from 'react-native-svg';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  useAnimatedProps
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useBookingStore, type Seat } from '@/store/useBookingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 450;
const MAP_WIDTH = SCREEN_WIDTH * 1.5; // Wider than screen for panning

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function ZoomableSeatMap() {
  const { seats, toggleSeat } = useBookingStore();
  
  // Transformation state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Constants for seat sizing
  const SEAT_SIZE = 32;
  const SEAT_GAP = 8;
  const ROW_HEIGHT = SEAT_SIZE + SEAT_GAP;
  const COL_WIDTH = SEAT_SIZE + SEAT_GAP;

  if (seats.length === 0) return null;

  const rows = seats.length;
  const cols = seats[0].length;
  const gridWidth = cols * COL_WIDTH;
  const gridHeight = rows * ROW_HEIGHT;

  // Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 0.8) {
        scale.value = withSpring(0.8);
        savedScale.value = 0.8;
      }
      if (scale.value > 2.5) {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleSeatPress = (seat: Seat) => {
    if (seat.status === 'taken') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSeat(seat.row, seat.number);
  };

  const getSeatColor = (status: string, type: string) => {
    if (status === 'selected') return Colors.seatSelected;
    if (status === 'taken') return Colors.seatTaken;
    if (type === 'vip') return Colors.seatVIP;
    return Colors.seatAvailable;
  };

  return (
    <View className="flex-1 bg-background overflow-hidden items-center justify-center">
      {/* Screen indicator (Fixed at top) */}
      <View className="absolute top-8 w-full items-center z-10 px-10">
        <View 
          className="w-full h-1 bg-secondary/60 rounded-full" 
          style={{ 
            transform: [{ perspective: 1000 }, { rotateX: '-45deg' }, { scaleX: 1.2 }],
            shadowColor: Colors.secondary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 20
          }}
        />
        <Text className="text-[10px] text-textMuted mt-4 tracking-[6px] font-bold uppercase opacity-50">
          מסך הקרנה
        </Text>
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[{ width: MAP_WIDTH, height: MAP_HEIGHT }, animatedStyle]} className="items-center justify-center">
          <Svg width={gridWidth + 40} height={gridHeight + 40} viewBox={`0 0 ${gridWidth + 40} ${gridHeight + 40}`}>
            <G x={20} y={20}>
              {seats.map((row, rowIndex) => (
                <G key={`row-${rowIndex}`} y={rowIndex * ROW_HEIGHT}>
                  {/* Row Label */}
                  <Text 
                    style={{ 
                      position: 'absolute', 
                      left: -25, 
                      top: 8, 
                      color: 'rgba(255,255,255,0.3)', 
                      fontSize: 10,
                      fontFamily: 'Outfit'
                    }}
                  >
                    {row[0].row}
                  </Text>
                  
                  {row.map((seat, colIndex) => {
                    const x = colIndex * COL_WIDTH;
                    const isSelected = seat.status === 'selected';
                    
                    return (
                      <G key={`${seat.row}-${seat.number}`} x={x}
                        onPress={() => handleSeatPress(seat)}
                      >
                        <Rect
                          width={SEAT_SIZE}
                          height={SEAT_SIZE}
                          rx={seat.type === 'vip' ? 8 : 6}
                          fill={getSeatColor(seat.status, seat.type)}
                          stroke={isSelected ? Colors.white : 'transparent'}
                          strokeWidth={2}
                        />
                        {seat.type === 'vip' && seat.status === 'available' && (
                          <Path 
                            d="M8 8 L24 24 M24 8 L8 24" 
                            stroke="rgba(255,255,255,0.1)" 
                            strokeWidth={1} 
                          />
                        )}
                        {isSelected && (
                          <Circle cx={SEAT_SIZE/2} cy={SEAT_SIZE/2} r={4} fill={Colors.background} />
                        )}
                      </G>
                    );
                  })}
                </G>
              ))}
            </G>
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Legend (Fixed at bottom) */}
      <View className="absolute bottom-32 flex-row-reverse gap-4 bg-surface/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
        <LegendItem color={Colors.seatAvailable} label="פנוי" />
        <LegendItem color={Colors.seatSelected} label="נבחר" />
        <LegendItem color={Colors.seatTaken} label="תפוס" />
        <LegendItem color={Colors.seatVIP} label="VIP" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row-reverse items-center gap-2">
      <View className="w-3.5 h-3.5 rounded-[4px]" style={{ backgroundColor: color }} />
      <Text className="text-label text-textSecondary font-body">{label}</Text>
    </View>
  );
}
