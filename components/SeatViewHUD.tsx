import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Volume2, Eye, Award } from 'lucide-react-native';
import Svg, { Path, Rect, Line, Circle, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { useSeatViewStore } from '@/store/useSeatViewStore';
import { Colors } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function SeatViewHUD() {
  const { 
    activeRow, 
    activeNumber, 
    activeViewCoords, 
    isHUDExpanded, 
    soundDb, 
    toggleHUD 
  } = useSeatViewStore();

  // Reanimated values for spatial perspective wiggles
  const perspectiveX = useSharedValue(0);
  const perspectiveY = useSharedValue(0);
  const soundWavePulse = useSharedValue(0.3);

  useEffect(() => {
    if (isHUDExpanded && activeViewCoords) {
      // Animate entry to actual seat perspective ratio
      perspectiveX.value = withSpring(activeViewCoords.x, { damping: 15 });
      perspectiveY.value = withSpring(activeViewCoords.y, { damping: 15 });
      
      // Infinite loop for pulsing audio waves
      soundWavePulse.value = withRepeat(
        withTiming(1.0, { duration: 2000 }),
        -1,
        true
      );
    } else {
      perspectiveX.value = 0;
      perspectiveY.value = 0;
    }
  }, [isHUDExpanded, activeViewCoords]);

  const animatedScreenStyle = useAnimatedStyle(() => {
    // 3D CSS rotate transform using coordinates for extreme premium feel
    const rotateY = `${perspectiveX.value * -20}deg`;
    const rotateX = `${(1.2 - perspectiveY.value) * 15}deg`;
    const scale = 0.85 + (1.0 - perspectiveY.value) * 0.15;

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: rotateX },
        { rotateY: rotateY },
        { scale: scale }
      ]
    };
  });

  const soundMeterStyle = useAnimatedStyle(() => {
    return {
      opacity: soundWavePulse.value,
      transform: [{ scale: 0.95 + soundWavePulse.value * 0.05 }]
    };
  });

  if (!isHUDExpanded || !activeViewCoords || !activeRow || !activeNumber) return null;

  // Compute viewing comfort based on distance (y) and side-angle (x)
  const angleText = Math.abs(activeViewCoords.x) < 0.2 
    ? 'מרכז - מעולה' 
    : activeViewCoords.x < 0 
      ? 'זווית שמאלית' 
      : 'זווית ימנית';
      
  const distanceScore = activeViewCoords.y < 0.4 
    ? 'קרוב מאוד למסך' 
    : activeViewCoords.y > 0.7 
      ? 'מרחק צפייה אחורי' 
      : 'מרחק צפייה אופטימלי';

  return (
    <View 
      className="absolute inset-0 justify-end z-50 pointer-events-box-none"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      {/* Tap outside to close */}
      <Pressable className="absolute inset-0" onPress={() => toggleHUD(false)} />

      <BlurView 
        intensity={95} 
        tint="dark" 
        className="w-full rounded-t-[40px] border-t border-white/10 bg-[#0A0A0C]/90 px-6 pt-5 pb-8"
      >
        {/* Header HUD control bar */}
        <View className="flex-row items-center justify-between pb-4 border-b border-white/5" style={{ flexDirection: 'row-reverse' }}>
          <View className="flex-row items-center gap-2" style={{ flexDirection: 'row-reverse' }}>
            <View className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 justify-center items-center">
              <Eye size={20} color={Colors.primary} />
            </View>
            <View className="items-end">
              <Text className="text-h3 text-white font-display text-right">הצצה ממושב {activeRow}{activeNumber}</Text>
              <Text className="text-[10px] text-white/50 font-sans text-right">סימולציית זווית ראייה תלת-מימדית</Text>
            </View>
          </View>
          
          <Pressable 
            onPress={() => toggleHUD(false)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 justify-center items-center active:scale-90"
          >
            <X size={20} color="white" />
          </Pressable>
        </View>

        {/* 3D Viewport Box */}
        <View className="my-6 items-center justify-center h-[170px] bg-black/40 rounded-3xl overflow-hidden border border-white/5 relative">
          <Animated.View style={[{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }, animatedScreenStyle]}>
            <Svg width={SCREEN_WIDTH - 80} height={140} viewBox="0 0 300 140">
              <Defs>
                <RadialGradient id="screenAmbientGlow" cx="50%" cy="0%" r="50%" fx="50%" fy="0%">
                  <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="screenBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </LinearGradient>
              </Defs>

              {/* Ceiling beam of projector light */}
              <Path d="M120 0 L180 0 L280 140 L20 140 Z" fill="url(#screenBeam)" />

              {/* Ambient screen reflection glow */}
              <Rect x={0} y={0} width={300} height={140} fill="url(#screenAmbientGlow)" />

              {/* Theater Walls (Perspective guides) */}
              <Line x1={0} y1={20} x2="50" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <Line x1={300} y1={20} x2="250" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              
              {/* Ceiling light rails */}
              <Line x1={50} y1={10} x2="250" y2="10" stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="5,5" />

              {/* Curved Cinema Screen */}
              <Path 
                d="M30 40 Q150 20 270 40" 
                stroke={Colors.primary} 
                strokeWidth={5} 
                fill="none" 
                strokeLinecap="round" 
              />
              {/* Screen Content Reflection */}
              <Path 
                d="M30 44 L30 80 Q150 65 270 80 L270 44 Q150 24 30 44 Z" 
                fill="rgba(255, 20, 100, 0.08)" 
                stroke="rgba(255, 20, 100, 0.2)"
                strokeWidth={1}
              />

              {/* Centered screen logo helper */}
              <Circle cx={150} cy={50} r={8} fill="rgba(255,255,255,0.15)" />
              <Path d="M148 47 L154 50 L148 53 Z" fill="white" />

              {/* Sound waves overlay wiggling */}
              <Path 
                d="M110 50 Q150 85 190 50" 
                stroke={Colors.secondary} 
                strokeWidth={1.5} 
                fill="none" 
                opacity={0.4} 
              />
              <Path 
                d="M90 50 Q150 100 210 50" 
                stroke={Colors.secondary} 
                strokeWidth={1.2} 
                fill="none" 
                opacity={0.25} 
              />
            </Svg>
          </Animated.View>

          {/* Glowing HUD indicators */}
          <View className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 rounded-full border border-white/10 flex-row items-center gap-1.5" style={{ flexDirection: 'row-reverse' }}>
            <View className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
            <Text className="text-[9px] text-[#00E5FF] font-display">זווית: {angleText}</Text>
          </View>

          <View className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 rounded-full border border-white/10 flex-row items-center gap-1.5">
            <Text className="text-[9px] text-white/70 font-sans">{distanceScore}</Text>
          </View>
        </View>

        {/* Sightline and Sound Metrics Cards */}
        <View className="flex-row gap-3 mb-2" style={{ flexDirection: 'row-reverse' }}>
          
          {/* Audio metric card */}
          <BlurView intensity={20} tint="dark" className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-3.5 items-end">
            <View className="flex-row items-center gap-2 mb-1.5" style={{ flexDirection: 'row-reverse' }}>
              <Volume2 size={16} color={Colors.secondary} />
              <Text className="text-[10px] text-white/40 font-bold font-display text-right">פיזור שמע אקוסטית</Text>
            </View>
            <View className="flex-row items-baseline gap-1" style={{ flexDirection: 'row-reverse' }}>
              <Text className="text-h1 text-white font-display">{soundDb}</Text>
              <Text className="text-[10px] text-white/50 font-bold font-sans">dB</Text>
            </View>
            
            {/* Visual sound bar indicator */}
            <View className="w-full h-1 bg-white/10 rounded-full mt-2.5 overflow-hidden">
              <Animated.View 
                style={[{ 
                  height: '100%', 
                  backgroundColor: Colors.secondary, 
                  width: `${(soundDb / 90) * 100}%` 
                }, soundMeterStyle]} 
              />
            </View>
            <Text className="text-[9px] text-white/40 mt-1.5 text-right font-medium">עוצמת שמע אופטימלית במושב זה</Text>
          </BlurView>

          {/* Comfort metric card */}
          <BlurView intensity={20} tint="dark" className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-3.5 items-end">
            <View className="flex-row items-center gap-2 mb-1.5" style={{ flexDirection: 'row-reverse' }}>
              <Award size={16} color={Colors.seatVIP} />
              <Text className="text-[10px] text-white/40 font-bold font-display text-right">מדד נוחות ראייה</Text>
            </View>
            <View className="flex-row items-baseline gap-0.5" style={{ flexDirection: 'row-reverse' }}>
              <Text className="text-h1 text-white font-display">
                {activeViewCoords.y < 0.3 ? '82' : activeViewCoords.y > 0.75 ? '88' : '96'}
              </Text>
              <Text className="text-[10px] text-white/50 font-bold font-sans">%</Text>
            </View>
            
            {/* Dynamic comfort bar */}
            <View className="w-full h-1 bg-white/10 rounded-full mt-2.5 overflow-hidden">
              <View 
                style={{ 
                  height: '100%', 
                  backgroundColor: Colors.seatVIP, 
                  width: `${activeViewCoords.y < 0.3 ? 82 : activeViewCoords.y > 0.75 ? 88 : 96}%` 
                }} 
              />
            </View>
            <Text className="text-[9px] text-white/40 mt-1.5 text-right font-medium">נוחות זווית הצוואר לעבר המסך</Text>
          </BlurView>

        </View>

        {/* Explanatory subtitle */}
        <Text className="text-[9.5px] text-white/30 text-center font-sans mt-3">
          *הסימולציה מבוססת על המפרט האדריכלי והאקוסטי של אולם ההקרנה.
        </Text>
      </BlurView>
    </View>
  );
}
