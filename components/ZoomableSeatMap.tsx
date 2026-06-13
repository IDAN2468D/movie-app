import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Rect, G, Path, Defs, LinearGradient, Stop, Mask, Text as SvgText, Circle } from 'react-native-svg';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useBookingStore } from '@/store/useBookingStore';
import { useSquadBookingStore } from '@/store/useSquadBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import CineEchoesSeatingOverlay from './CineEchoesSeatingOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Declare Animated SVG Group component for smooth seat micro-interactions
const AnimatedG = Animated.createAnimatedComponent(G) as any;

// Detailed Seat Component for SVG
const SeatIcon = ({ 
  isSelected, 
  isTaken, 
  isVIP, 
  isSweetSpot,
  friendColor,
  isHoveredByFriend,
  hasEcho,
  onPressIn,
  onPressOut,
  onPress 
}: { 
  isSelected: boolean; 
  isTaken: boolean; 
  isVIP: boolean; 
  isSweetSpot: boolean;
  friendColor: string | null;
  isHoveredByFriend: string | null;
  hasEcho?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }]
  }));

  const handlePressIn = () => {
    if (isTaken) return;
    scale.value = 0.9;
    if (onPressIn) onPressIn();
  };

  const handlePressOut = () => {
    if (isTaken) return;
    scale.value = 1;
    onPress();
    if (onPressOut) onPressOut();
  };

  // Premium design styling based on seat state
  let fillColor = 'rgba(255, 255, 255, 0.12)'; // Available standard
  let strokeColor = 'rgba(255, 255, 255, 0.2)';
  let seatOpacity = 1.0;

  if (isTaken) {
    fillColor = 'rgba(255, 255, 255, 0.02)';
    strokeColor = 'rgba(255, 255, 255, 0.06)';
    seatOpacity = 0.25;
  } else if (isSelected) {
    fillColor = Colors.seatSelected; // Neon Yellow/Green
    strokeColor = '#FFFFFF';
  } else if (friendColor) {
    fillColor = friendColor; // Friend selection color
    strokeColor = '#FFFFFF';
  } else if (isVIP) {
    fillColor = Colors.seatVIP; // Pink/Red
    strokeColor = 'rgba(255, 255, 255, 0.35)';
  }

  return (
    <AnimatedG 
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Selected Seat Glow */}
      {(isSelected || friendColor) && (
        <Rect 
          x={-3} y={-3} 
          width={30} height={34} 
          rx={8} 
          fill={isSelected ? Colors.seatSelected : friendColor!} 
          opacity={0.3} 
        />
      )}

      {/* Sweet Spot Aura */}
      {isSweetSpot && !isTaken && !isSelected && !friendColor && (
        <Rect 
          x={-2} y={-2} 
          width={28} height={32} 
          rx={8} 
          fill={Colors.secondary} 
          opacity={0.15} 
          stroke={Colors.secondary}
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
      )}
      
      {/* CineEcho pulsing ring */}
      {hasEcho && !isTaken && !isSelected && !friendColor && (
        <Rect 
          x={-2} y={-2} 
          width={28} height={32} 
          rx={8} 
          fill="none" 
          stroke={Colors.primary} 
          strokeWidth={1.5} 
          opacity={0.8}
        />
      )}
      
      {/* Main Seat Body (Backrest) */}
      <Rect 
        x={2} y={2} 
        width={20} height={24} 
        rx={5} 
        fill={fillColor} 
        stroke={strokeColor}
        strokeWidth={0.5}
        opacity={seatOpacity}
      />
      
      {/* Cushion */}
      <Rect 
        x={2} y={18} 
        width={20} height={10} 
        rx={4} 
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={0.5}
        opacity={seatOpacity}
      />

      {/* Armrests */}
      <Rect x={0} y={12} width={4} height={12} rx={2} fill={fillColor} opacity={isTaken ? 0.2 : 0.6} />
      <Rect x={20} y={12} width={4} height={12} rx={2} fill={fillColor} opacity={isTaken ? 0.2 : 0.6} />

      {/* VIP Crown Icon Path */}
      {isVIP && !isTaken && !isSelected && !friendColor && (
        <Path 
          d="M8 9 L10 7 L12 9 L14 7 L16 9" 
          stroke="white" 
          strokeWidth={1} 
          fill="none" 
          opacity={0.65}
        />
      )}

      {/* Friend Hover Indicator */}
      {isHoveredByFriend && (
        <G>
          <Rect 
            x={-1} y={-1} 
            width={26} height={30} 
            rx={7} 
            fill="none" 
            stroke={friendColor || Colors.secondary} 
            strokeWidth={1.5} 
            opacity={0.8}
          />
          {/* Small user initials badge */}
          <Rect
            x={2} y={-8}
            width={20} height={10}
            rx={3}
            fill={friendColor || Colors.secondary}
          />
          <SvgText
            x={12} y={0}
            fill="#09090B"
            fontSize={7}
            fontWeight="bold"
            textAnchor="middle"
          >
            {isHoveredByFriend.substring(0, 2)}
          </SvgText>
        </G>
      )}
    </AnimatedG>
  );
};

export default function ZoomableSeatMap() {
  const { seats, toggleSeat, selectedSeats, selectedShowtime } = useBookingStore();
  const { squadCode, sessionDetails, hovers, cursors, toggleSquadSeat, sendSeatHover, sendCursorMove } = useSquadBookingStore();
  const user = useAuthStore(state => state.user);

  const [echos, setEchos] = useState<Record<string, { uri: string; userName: string; duration: string }>>({
    'D-4': { uri: 'mock-audio-1.m4a', userName: 'רועי', duration: '0:05' },
    'E-6': { uri: 'mock-audio-2.m4a', userName: 'מיה', duration: '0:08' },
    'C-8': { uri: 'mock-audio-3.m4a', userName: 'איתי', duration: '0:04' },
  });
  const [selectedEchoSeat, setSelectedEchoSeat] = useState<string | null>(null);

  const handleSaveEcho = (seatId: string, uri: string) => {
    setEchos(prev => ({
      ...prev,
      [seatId]: { uri, userName: user?.name || 'חבר קהילה', duration: '0:10' }
    }));
  };

  const getMemberColor = (userId: string) => {
    if (!sessionDetails) return '#00E5FF';
    const idx = sessionDetails.members.findIndex(m => m.userId === userId);
    if (idx === -1) return '#00E5FF';
    const colors = ['#00E5FF', '#FFC107', '#E040FB', '#00E676', '#FF5252'];
    return colors[idx % colors.length];
  };
  
  const ROW_HEIGHT = 45;
  const COL_WIDTH = 32;

  const hasSeats = seats && seats.length > 0;
  const rows = hasSeats ? seats.length : 0;
  const cols = hasSeats ? seats[0].length : 0;
  const gridWidth = cols * COL_WIDTH;
  const gridHeight = rows * ROW_HEIGHT;

  // Calculate dynamic scale to fit the seats perfectly within screen bounds on start
  const initialScale = hasSeats ? Math.min((SCREEN_WIDTH - 40) / (gridWidth + 60), 1.0) : 1.0;

  const scale = useSharedValue(initialScale);
  const savedScale = useSharedValue(initialScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Tooltip interactive state (complying with Rule 102/103/107)
  const [activeTooltipSeat, setActiveTooltipSeat] = useState<{ row: string; number: number } | null>(null);
  const [stableSeatDetails, setStableSeatDetails] = useState<{ row: string; number: number } | null>(null);

  // Tooltip animation shared values for elastic spring transitions
  const tooltipOpacity = useSharedValue(0);
  const tooltipScale = useSharedValue(0.9);
  const tooltipTranslateY = useSharedValue(5);

  const animatedTooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [
      { scale: tooltipScale.value },
      { translateY: tooltipTranslateY.value }
    ]
  }));

  // Sync tooltip dynamically with the latest selected seat
  useEffect(() => {
    if (selectedSeats && selectedSeats.length > 0) {
      const lastSeat = selectedSeats[selectedSeats.length - 1];
      setActiveTooltipSeat({ row: lastSeat.row, number: lastSeat.number });
    } else {
      setActiveTooltipSeat(null);
    }
  }, [selectedSeats]);

  // Handle tooltip pop elastic scale and fade transitions on focus shift
  useEffect(() => {
    if (activeTooltipSeat) {
      setStableSeatDetails(activeTooltipSeat);
      tooltipScale.value = 0.92;
      tooltipScale.value = withSpring(1, { damping: 12, stiffness: 150 });
      tooltipOpacity.value = withSpring(1, { damping: 15 });
      tooltipTranslateY.value = withSpring(0, { damping: 15 });
    } else {
      tooltipOpacity.value = withSpring(0, { damping: 15 });
      tooltipScale.value = withSpring(0.9, { damping: 15 });
      tooltipTranslateY.value = withSpring(5, { damping: 15 });
      const timer = setTimeout(() => {
        setStableSeatDetails(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTooltipSeat, tooltipOpacity, tooltipScale, tooltipTranslateY]);

  // Automatically reset pan/zoom whenever the layout scale factor updates
  useEffect(() => {
    scale.value = initialScale;
    savedScale.value = initialScale;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [initialScale, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < initialScale * 0.7) {
        scale.value = withSpring(initialScale);
        savedScale.value = initialScale;
      }
      if (scale.value > 2.5) {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const maxTransX = (gridWidth * scale.value) / 1.5;
      const maxTransY = (gridHeight * scale.value) / 1.5;
      translateX.value = Math.max(-maxTransX, Math.min(maxTransX, savedTranslateX.value + e.translationX));
      translateY.value = Math.max(-maxTransY, Math.min(maxTransY, savedTranslateY.value + e.translationY));
      
      if (squadCode && sendCursorMove) {
        // Compute touch position relative to the seat grid coordinate system (offset x=40, y=60)
        const gridTouchX = (e.x - 40 - translateX.value) / scale.value;
        const gridTouchY = (e.y - 60 - translateY.value) / scale.value;
        runOnJS(sendCursorMove)(gridTouchX, gridTouchY);
      }
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

  if (!hasSeats) return null;

  // Render SVG map dimensions with top clearance for the floating tooltip
  const svgWidth = gridWidth + 80;
  const svgHeight = gridHeight + 100;

  // Find rowIndex and colIndex of the stable seat details to anchor the tooltip
  let tooltipRowIndex = -1;
  let tooltipColIndex = -1;
  let activeSeatObj = null;

  if (stableSeatDetails) {
    for (let r = 0; r < seats.length; r++) {
      const colIdx = seats[r].findIndex(s => s.row === stableSeatDetails.row && s.number === stableSeatDetails.number);
      if (colIdx !== -1) {
        tooltipRowIndex = r;
        tooltipColIndex = colIdx;
        activeSeatObj = seats[r][colIdx];
        break;
      }
    }
  }

  // Tooltip geometry calculations
  let tooltipPath = '';
  let seatCenterX = 0;
  let seatY = 0;
  let tooltipTipY = 0;
  let rectX = 0;
  let rectY = 0;
  const W = 148;
  const H = 46;

  let isVIP = false;
  let isSweetSpot = false;
  let categoryName = 'רגיל';
  let categoryIcon = '🎬';
  let categoryColor = 'rgba(255, 255, 255, 0.7)';
  let seatPrice = selectedShowtime ? selectedShowtime.price : 40;

  if (stableSeatDetails && activeSeatObj) {
    const perspectiveOffset = (rows - tooltipRowIndex) * 2;
    const rowScale = 1 - (rows - tooltipRowIndex) * 0.01;

    // Anchor precisely at the visual center of the seat icon (local offset 12 scaled)
    seatCenterX = perspectiveOffset + (tooltipColIndex * COL_WIDTH + 12) * rowScale;
    seatY = tooltipRowIndex * ROW_HEIGHT;
    tooltipTipY = seatY + 2 * rowScale - 4;
    
    // Mathematically restrict the tooltip horizontal axis to avoid edge clipping (Col 1 & Col 12 bounds)
    rectX = Math.max(-15, Math.min(gridWidth - W + 15, seatCenterX - W / 2));
    rectY = tooltipTipY - H;

    isVIP = activeSeatObj.type === 'vip';
    isSweetSpot = tooltipRowIndex >= Math.floor(rows * 0.35) && tooltipRowIndex <= Math.floor(rows * 0.6) && 
                 tooltipColIndex >= Math.floor(cols * 0.3) && tooltipColIndex <= Math.floor(cols * 0.7);

    if (isVIP) {
      categoryName = 'VIP';
      categoryIcon = '👑';
      categoryColor = Colors.seatVIP;
      seatPrice = seatPrice * 1.5;
    } else if (isSweetSpot) {
      categoryName = 'סוויט ספוט';
      categoryIcon = '✨';
      categoryColor = Colors.secondary;
    }

    const rx = 10;
    tooltipPath = `
      M ${rectX + rx} ${rectY}
      H ${rectX + W - rx}
      A ${rx} ${rx} 0 0 1 ${rectX + W} ${rectY + rx}
      V ${rectY + H - rx}
      A ${rx} ${rx} 0 0 1 ${rectX + W - rx} ${rectY + H}
      H ${seatCenterX + 6}
      L ${seatCenterX} ${tooltipTipY}
      L ${seatCenterX - 6} ${rectY + H}
      H ${rectX + rx}
      A ${rx} ${rx} 0 0 1 ${rectX} ${rectY + H - rx}
      V ${rectY + rx}
      A ${rx} ${rx} 0 0 1 ${rectX + rx} ${rectY}
      Z
    `.replace(/\s+/g, ' ').trim();
  }

  const tooltipStrokeColor = isVIP 
    ? Colors.seatVIP 
    : isSweetSpot 
      ? Colors.secondary 
      : 'rgba(255, 255, 255, 0.3)';

  return (
    <View className="flex-1 justify-between bg-black/20">
      
      {/* 1. Curved Cinema Screen at the Top (Static, No Overlap) */}
      <View className="w-full items-center pt-5 pb-2">
        <Svg width={SCREEN_WIDTH} height={50} viewBox={`0 0 ${SCREEN_WIDTH} 50`}>
          <Defs>
            <LinearGradient id="screenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0" />
            </LinearGradient>
            <Mask id="screenMask">
              <Path d={`M40,35 Q${SCREEN_WIDTH/2},5 ${SCREEN_WIDTH-40},35`} stroke="white" strokeWidth={5} fill="none" />
            </Mask>
          </Defs>
          
          {/* Main Curved Screen Line */}
          <Path 
            d={`M40,35 Q${SCREEN_WIDTH/2},5 ${SCREEN_WIDTH-40},35`} 
            stroke={Colors.primary} 
            strokeWidth={3} 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* Screen Light Reflection Glow */}
          <Rect 
            x={0} y={0} 
            width={SCREEN_WIDTH} height={50} 
            fill="url(#screenGlow)" 
            mask="url(#screenMask)" 
          />
        </Svg>
        <Text style={{ 
          fontFamily: 'Rubik', 
          fontSize: 10, 
          color: 'rgba(255, 20, 100, 0.7)', 
          letterSpacing: 8, 
          textAlign: 'center', 
          marginTop: -16, 
          fontWeight: '700' 
        }}>
          מסך הקרנה
        </Text>
      </View>

      {/* 2. Interactive Seat Grid Map in the Center (Scrollable & Scaled, No Overlap) */}
      <View className="flex-1 justify-center items-center overflow-hidden">
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[{ width: svgWidth, height: svgHeight }, animatedStyle]} className="items-center justify-center">
            <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <Defs>
                <LinearGradient id="tooltipBg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="rgba(26, 21, 35, 0.95)" />
                  <Stop offset="100%" stopColor="rgba(10, 8, 15, 0.98)" />
                </LinearGradient>
              </Defs>
              
              <G x={40} y={60}>
                {/* Background Tap-to-Dismiss Layer covering the entire interactive map canvas */}
                <Rect 
                  x={-40} 
                  y={-60} 
                  width={svgWidth} 
                  height={svgHeight} 
                  fill="transparent" 
                  onPress={() => {
                    if (activeTooltipSeat) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTooltipSeat(null);
                    }
                  }}
                />

                {seats.map((row, rowIndex) => {
                  // Slight opening curvature perspective effect per row
                  const perspectiveOffset = (rows - rowIndex) * 2;
                  const rowScale = 1 - (rows - rowIndex) * 0.01;
                  
                  return (
                    <G 
                      key={`row-${rowIndex}`} 
                      y={rowIndex * ROW_HEIGHT} 
                      x={perspectiveOffset}
                      scale={rowScale}
                    >
                      {/* Left Row Indicator */}
                      <Text 
                        style={{ 
                          position: 'absolute', 
                          left: -28, 
                          top: 10, 
                          color: 'rgba(255,255,255,0.3)', 
                          fontSize: 11,
                          fontFamily: 'Outfit',
                          fontWeight: 'bold',
                        }}
                      >
                        {row[0].row}
                      </Text>

                      {row.map((seat, colIndex) => (
                        <G key={`${seat.row}-${seat.number}`} x={colIndex * COL_WIDTH}>
                          {(() => {
                            const isSweetSpotRow = rowIndex >= Math.floor(rows * 0.35) && rowIndex <= Math.floor(rows * 0.6);
                            const isSweetSpotCol = colIndex >= Math.floor(cols * 0.3) && colIndex <= Math.floor(cols * 0.7);
                            const isSweetSpot = isSweetSpotRow && isSweetSpotCol;

                            // Squad Sync Selection Logic
                            const lockedSeat = sessionDetails?.lockedSeats.find(s => s.row === seat.row && s.number === seat.number);
                            const isSelected = squadCode 
                              ? (lockedSeat?.userId === user?.id)
                              : seat.status === 'selected';
                            
                            const isTaken = seat.status === 'taken';
                            
                            const friendColor = (squadCode && lockedSeat && lockedSeat.userId !== user?.id)
                              ? getMemberColor(lockedSeat.userId)
                              : null;

                            const hoverInfo = hovers[`${seat.row}-${seat.number}`];
                            const isHoveredByFriend = (squadCode && hoverInfo && hoverInfo.userId !== user?.id)
                              ? hoverInfo.userName
                              : null;

                            const seatKey = `${seat.row}-${seat.number}`;
                            const hasEcho = !!echos[seatKey];

                            return (
                              <SeatIcon 
                                isSelected={isSelected}
                                isTaken={isTaken}
                                isVIP={seat.type === 'vip'}
                                isSweetSpot={isSweetSpot}
                                friendColor={friendColor}
                                isHoveredByFriend={isHoveredByFriend}
                                hasEcho={hasEcho}
                                onPressIn={() => {
                                  if (squadCode && !isTaken) {
                                    sendSeatHover(seat.row, seat.number, true);
                                  }
                                }}
                                onPressOut={() => {
                                  if (squadCode && !isTaken) {
                                    sendSeatHover(seat.row, seat.number, false);
                                  }
                                }}
                                onPress={() => {
                                  if (hasEcho) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setSelectedEchoSeat(seatKey);
                                    return;
                                  }
                                  if (isSelected) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setSelectedEchoSeat(seatKey);
                                    return;
                                  }
                                  if (!isTaken) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    if (squadCode) {
                                      toggleSquadSeat(seat.row, seat.number);
                                    } else {
                                      toggleSeat(seat.row, seat.number);
                                    }
                                  }
                                }}
                              />
                            );
                          })()}
                        </G>
                      ))}

                      {/* Right Row Indicator */}
                      <Text 
                        style={{ 
                          position: 'absolute', 
                          left: cols * COL_WIDTH + 8, 
                          top: 10, 
                          color: 'rgba(255,255,255,0.3)', 
                          fontSize: 11,
                          fontFamily: 'Outfit',
                          fontWeight: 'bold',
                        }}
                      >
                        {row[0].row}
                      </Text>
                    </G>
                  );
                })}

                {/* 3. Interactive Floating Glassmorphic Tooltip Overlay */}
                {stableSeatDetails && activeSeatObj && (
                  <AnimatedG style={animatedTooltipStyle}>
                    {/* Unified Speech Bubble SVG Path to prevent stroke overlapping */}
                    <Path
                      d={tooltipPath}
                      fill="url(#tooltipBg)"
                      stroke={tooltipStrokeColor}
                      strokeWidth={1.2}
                    />
                    
                    {/* Centered Hebrew Text elements with strict direction control */}
                    <SvgText
                      x={rectX + W / 2}
                      y={rectY + 18}
                      fill="#FFFFFF"
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="Rubik"
                      textAnchor="middle"
                    >
                      {`שורה \u200E${stableSeatDetails.row}\u200F • ${selectedSeats.length === 1 ? `מושב \u200E${stableSeatDetails.number}\u200F` : `\u200E${selectedSeats.length}\u200F מושבים`}`}
                    </SvgText>
                    
                    <SvgText
                      x={rectX + W / 2}
                      y={rectY + 33}
                      fill={categoryColor}
                      fontSize={10}
                      fontWeight="600"
                      fontFamily="Assistant"
                      textAnchor="middle"
                    >
                      {`\u200F${categoryIcon} ${categoryName}\u200F • \u200F₪\u200E${seatPrice}\u200F`}
                    </SvgText>
                  </AnimatedG>
                )}

                {/* Render Live Cursors from other active lobby members */}
                {squadCode && Object.values(cursors).map((cursor) => {
                  if (cursor.userId === user?.id) return null;
                  const memberColor = getMemberColor(cursor.userId);
                  return (
                    <G key={`cursor-${cursor.userId}`} x={cursor.x} y={cursor.y}>
                      {/* Glowing crystal dot */}
                      <Circle cx={0} cy={0} r={5} fill={memberColor} opacity={0.9} />
                      <Circle cx={0} cy={0} r={10} fill="none" stroke={memberColor} strokeWidth={1} opacity={0.4} />
                      {/* Initials overlay */}
                      <Rect x={6} y={-10} width={20} height={10} rx={3} fill="rgba(10,10,12,0.85)" stroke={memberColor} strokeWidth={0.5} />
                      <SvgText x={16} y={-2} fill="#FFFFFF" fontSize={6} fontWeight="bold" textAnchor="middle">
                        {cursor.userName.substring(0, 2)}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* 3. Static Premium Legend at the Bottom (Completely Dynamic and Elegant) */}
      <View className="items-center pb-4 pt-1">
        <BlurView 
          intensity={30} 
          tint="dark" 
          className="flex-row gap-4 px-5 py-2.5 rounded-full bg-surfaceLight/50 border border-white/10"
        >
          <LegendItem color="rgba(255, 255, 255, 0.15)" label="פנוי" borderStyle="rgba(255, 255, 255, 0.25)" />
          <LegendItem color={Colors.seatSelected} label="נבחר" />
          <LegendItem color="rgba(255, 255, 255, 0.02)" label="תפוס" borderStyle="rgba(255, 255, 255, 0.05)" />
          <LegendItem color={Colors.seatVIP} label="VIP" />
          <LegendItem color={Colors.secondary} label="הסוויט ספוט" isSweetSpot />
        </BlurView>
      </View>
      
      {selectedEchoSeat && (
        <CineEchoesSeatingOverlay
          seatId={selectedEchoSeat}
          echoData={echos[selectedEchoSeat] || null}
          onClose={() => setSelectedEchoSeat(null)}
          onSaveEcho={handleSaveEcho}
        />
      )}
    </View>
  );
}

// Compact Legend Item Helper
function LegendItem({ 
  color, 
  label, 
  isSweetSpot,
  borderStyle 
}: { 
  color: string; 
  label: string; 
  isSweetSpot?: boolean;
  borderStyle?: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5" style={{ flexDirection: 'row' }}>
      <View 
        style={{ 
          width: 9, 
          height: 9, 
          borderRadius: 2.5, 
          backgroundColor: color,
          borderColor: borderStyle || 'rgba(255,255,255,0.15)',
          borderWidth: borderStyle ? 0.5 : 0,
          justifyContent: 'center',
          alignItems: 'center',
          ...(isSweetSpot && {
            borderColor: Colors.secondary,
            borderWidth: 1,
            shadowColor: Colors.secondary,
            shadowRadius: 3,
            shadowOpacity: 0.6,
          })
        }} 
      />
      <Text style={{ fontFamily: 'Assistant', fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
