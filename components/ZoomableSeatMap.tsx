import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, G, Path, Defs, LinearGradient, Stop, Mask } from 'react-native-svg';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useBookingStore } from '@/store/useBookingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 500;
const MAP_WIDTH = SCREEN_WIDTH * 1.8;

// Detailed Seat Component for SVG
const SeatIcon = ({ 
  isSelected, 
  isTaken, 
  isVIP, 
  isSweetSpot,
  onPress 
}: { 
  isSelected: boolean; 
  isTaken: boolean; 
  isVIP: boolean; 
  isSweetSpot: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }]
  }));

  const handlePressIn = () => {
    if (isTaken) return;
    scale.value = 0.9;
  };

  const handlePressOut = () => {
    if (isTaken) return;
    scale.value = 1;
    onPress();
  };

  const baseColor = isTaken ? 'rgba(255,255,255,0.05)' : isVIP ? Colors.seatVIP : 'rgba(255,255,255,0.12)';
  const activeColor = isSelected ? Colors.primary : baseColor;
  const strokeColor = isSelected ? Colors.white : 'rgba(255,255,255,0.1)';

  return (
    <G 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {isSelected && (
        <Rect 
          x={-4} y={-4} 
          width={32} height={36} 
          rx={8} 
          fill={Colors.primary} 
          opacity={0.3} 
        />
      )}

      {/* Sweet Spot Glow */}
      {isSweetSpot && !isTaken && !isSelected && (
        <Rect 
          x={-2} y={-2} 
          width={28} height={32} 
          rx={8} 
          fill={Colors.secondary} 
          opacity={0.15} 
        />
      )}
      
      {/* Main Seat Body (Backrest) */}
      <Rect 
        x={2} y={2} 
        width={20} height={24} 
        rx={5} 
        fill={activeColor} 
        stroke={strokeColor}
        strokeWidth={0.5}
      />
      
      {/* Cushion */}
      <Rect 
        x={2} y={18} 
        width={20} height={10} 
        rx={4} 
        fill={activeColor}
        stroke={strokeColor}
        strokeWidth={0.5}
      />

      {/* Armrests */}
      <Rect x={0} y={12} width={4} height={12} rx={2} fill={activeColor} opacity={0.6} />
      <Rect x={20} y={12} width={4} height={12} rx={2} fill={activeColor} opacity={0.6} />

      {/* VIP Indicator */}
      {isVIP && !isTaken && !isSelected && (
        <Path 
          d="M8 8 L12 4 L16 8" 
          stroke="white" 
          strokeWidth={1} 
          fill="none" 
          opacity={0.5}
        />
      )}
    </G>
  );
};

export default function ZoomableSeatMap() {
  const { seats, toggleSeat } = useBookingStore();
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);


  const ROW_HEIGHT = 45;
  const COL_WIDTH = 32;

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 0.6) scale.value = withSpring(0.6);
      if (scale.value > 2) scale.value = withSpring(2);
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!seats || seats.length === 0) return null;

  const rows = seats.length;
  const cols = seats[0].length;
  const gridWidth = cols * COL_WIDTH;
  const gridHeight = rows * ROW_HEIGHT;

  return (
    <View className="flex-1 items-center justify-center overflow-hidden">
      {/* Perspective Screen Section */}
      <View className="absolute top-0 w-full items-center z-10 pt-4">
        <Svg width={SCREEN_WIDTH} height={120} viewBox={`0 0 ${SCREEN_WIDTH} 120`}>
          <Defs>
            <LinearGradient id="screenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0" />
            </LinearGradient>
            <Mask id="screenMask">
              <Path d={`M40,80 Q${SCREEN_WIDTH/2},20 ${SCREEN_WIDTH-40},80`} stroke="white" strokeWidth={6} fill="none" />
            </Mask>
          </Defs>
          
          {/* Main Curved Screen */}
          <Path 
            d={`M40,80 Q${SCREEN_WIDTH/2},20 ${SCREEN_WIDTH-40},80`} 
            stroke={Colors.primary} 
            strokeWidth={4} 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* Light Reflection */}
          <Rect 
            x={0} y={0} 
            width={SCREEN_WIDTH} height={120} 
            fill="url(#screenGlow)" 
            mask="url(#screenMask)" 
          />
        </Svg>
        <Text className="text-[10px] text-primary/60 -mt-10 tracking-[12px] font-bold uppercase">
          מסך הקרנה
        </Text>
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[{ width: MAP_WIDTH, height: MAP_HEIGHT }, animatedStyle]} className="items-center justify-center">
          <Svg width={gridWidth + 100} height={gridHeight + 100} viewBox={`0 0 ${gridWidth + 100} ${gridHeight + 100}`}>
            <G x={50} y={50}>
              {seats.map((row, rowIndex) => {
                // Perspective calculation: offset x based on row to create an "opening" effect
                const perspectiveOffset = (rows - rowIndex) * 4;
                const rowScale = 1 - (rows - rowIndex) * 0.015;
                
                return (
                  <G 
                    key={`row-${rowIndex}`} 
                    y={rowIndex * ROW_HEIGHT} 
                    x={perspectiveOffset}
                    scale={rowScale}
                  >
                    {/* Row Label */}
                    <Text 
                      style={{ 
                        position: 'absolute', 
                        left: -40, 
                        top: 10, 
                        color: 'rgba(255,255,255,0.3)', 
                        fontSize: 10,
                        fontFamily: 'Outfit',
                        fontWeight: 'bold'
                      }}
                    >
                      {row[0].row}
                    </Text>

                    {row.map((seat, colIndex) => (
                      <G key={`${seat.row}-${seat.number}`} x={colIndex * COL_WIDTH}>
                        {(() => {
                          const isSweetSpotRow = rowIndex >= Math.floor(rows * 0.4) && rowIndex <= Math.floor(rows * 0.6);
                          const isSweetSpotCol = colIndex >= Math.floor(cols * 0.3) && colIndex <= Math.floor(cols * 0.7);
                          const isSweetSpot = isSweetSpotRow && isSweetSpotCol;

                          return (
                            <SeatIcon 
                              isSelected={seat.status === 'selected'}
                              isTaken={seat.status === 'taken'}
                              isVIP={seat.type === 'vip'}
                              isSweetSpot={isSweetSpot}
                              onPress={() => {
                                if (seat.status !== 'taken') {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  toggleSeat(seat.row, seat.number);
                                }
                              }}
                            />
                          );
                        })()}
                      </G>
                    ))}
                  </G>
                );
              })}
            </G>
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Premium Legend - Moved lower as requested */}
      <View className="absolute top-40 flex-row gap-5 px-6 py-2.5 rounded-full bg-surfaceLight border border-white/10">
        <LegendItem color="rgba(255,255,255,0.12)" label="פנוי" />
        <LegendItem color={Colors.primary} label="נבחר" />
        <LegendItem color="rgba(255,255,255,0.05)" label="תפוס" />
        <LegendItem color={Colors.seatVIP} label="VIP" />
        <LegendItem color={Colors.secondary} label="הנקודה המושלמת" isGlow />
      </View>
    </View>
  );
}

function LegendItem({ color, label, isGlow }: { color: string; label: string; isGlow?: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View 
        className="w-3 h-3 rounded-full" 
        style={{ 
          backgroundColor: color,
          opacity: isGlow ? 0.6 : 1,
          shadowColor: color,
          shadowRadius: isGlow ? 4 : 0,
          shadowOpacity: isGlow ? 1 : 0,
        }} 
      />
      <Text className="text-[10px] text-white/60 font-bold">{label}</Text>
    </View>
  );
}
