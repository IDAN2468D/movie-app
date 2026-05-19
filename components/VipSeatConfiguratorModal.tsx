/**
 * VipSeatConfiguratorModal.tsx
 * Premium interactive VIP seat customization experience.
 * Features: live SVG reclining chair, haptic sliders, heating control, amenity toggles, and a sensory test.
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolateColor,
  useDerivedValue,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  RadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { Colors } from '@/constants/Theme';
import {
  useVipCustomStore,
  VipSeatConfig,
  HeatingLevel,
} from '@/store/useVipCustomStore';
import { Seat } from '@/store/useBookingStore';

const { width: SW } = Dimensions.get('window');

// ─── Animated SVG Chair ──────────────────────────────────────────────────────

const AnimatedPath = Animated.createAnimatedComponent(Path as any);
const AnimatedG = Animated.createAnimatedComponent(G as any);

function SeatSvgIllustration({
  recline,
  legRest,
  heatingLevel,
}: {
  recline: number;
  legRest: number;
  heatingLevel: HeatingLevel;
}) {
  // Map 0-100 → rotation degrees for backrest (0° = upright, -38° = fully reclined)
  const backrestDeg = -(recline / 100) * 38;
  // Map 0-100 → rotation degrees for legrest (0° = flat, 40° = raised)
  const legrestDeg = (legRest / 100) * 40;

  const glowOpacity = heatingLevel > 0 ? (heatingLevel / 3) * 0.55 : 0;

  const W = SW - 80;
  const H = 200;
  const cx = W / 2;

  // Chair pivot points
  const seatTop = 120;
  const seatBottom = 155;
  const seatLeft = cx - 55;
  const seatRight = cx + 55;

  // Backrest pivot at top of seat
  const pivotX = cx;
  const pivotY = seatTop;

  // Backrest path (relative to pivot, then rotated)
  const backH = 88;
  const backW = 108;
  const bx = pivotX - backW / 2;
  const by = pivotY - backH;

  // Footrest pivot at right edge of seat base
  const footPivotX = seatRight;
  const footPivotY = seatBottom;

  return (
    <Svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`}>
      <Defs>
        <RadialGradient id="heatGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity={glowOpacity} />
          <Stop offset="100%" stopColor="#FF1464" stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id="chairBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#2A1A2E" />
          <Stop offset="100%" stopColor="#150E1A" />
        </SvgLinearGradient>
        <SvgLinearGradient id="vipAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={Colors.seatVIP} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={Colors.primaryLight} stopOpacity="0.5" />
        </SvgLinearGradient>
      </Defs>

      {/* Heating aura glow behind chair */}
      <Ellipse
        cx={cx}
        cy={seatTop + 20}
        rx={85}
        ry={70}
        fill="url(#heatGlow)"
      />

      {/* ─── Seat Base ─── */}
      <Path
        d={`M${seatLeft} ${seatTop} H${seatRight} V${seatBottom} Q${seatRight} ${seatBottom + 8} ${seatRight - 8} ${seatBottom + 8} H${seatLeft + 8} Q${seatLeft} ${seatBottom + 8} ${seatLeft} ${seatBottom} Z`}
        fill="url(#chairBody)"
        stroke="rgba(255,20,100,0.35)"
        strokeWidth={1}
      />
      {/* Seat cushion highlight */}
      <Path
        d={`M${seatLeft + 6} ${seatTop + 4} H${seatRight - 6} V${seatTop + 14} Q${cx} ${seatTop + 20} ${seatLeft + 6} ${seatTop + 14} Z`}
        fill="rgba(255,255,255,0.06)"
      />

      {/* ─── Backrest (rotated around pivot) ─── */}
      <G
        origin={`${pivotX}, ${pivotY}`}
        rotation={backrestDeg}
      >
        {/* Backrest body */}
        <Path
          d={`M${bx} ${by + 12} Q${bx} ${by} ${bx + 12} ${by} H${bx + backW - 12} Q${bx + backW} ${by} ${bx + backW} ${by + 12} V${pivotY - 2} H${bx} Z`}
          fill="url(#chairBody)"
          stroke="rgba(255,20,100,0.4)"
          strokeWidth={1}
        />
        {/* Backrest cushion highlight */}
        <Path
          d={`M${bx + 6} ${by + 6} H${bx + backW - 6} V${by + 22} Q${bx + backW / 2} ${by + 28} ${bx + 6} ${by + 22} Z`}
          fill="rgba(255,255,255,0.05)"
        />
        {/* VIP accent trim strip at top */}
        <Path
          d={`M${bx + 12} ${by + 3} H${bx + backW - 12}`}
          stroke="url(#vipAccent)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Headrest pillow */}
        <Path
          d={`M${bx + 20} ${by} Q${cx} ${by - 18} ${bx + backW - 20} ${by}`}
          fill="url(#chairBody)"
          stroke="rgba(255,20,100,0.5)"
          strokeWidth={1}
        />
      </G>

      {/* ─── Left Armrest ─── */}
      <Path
        d={`M${seatLeft - 2} ${seatTop + 2} H${seatLeft - 14} Q${seatLeft - 18} ${seatTop + 2} ${seatLeft - 18} ${seatTop + 10} V${seatBottom - 4} Q${seatLeft - 18} ${seatBottom} ${seatLeft - 14} ${seatBottom} H${seatLeft} Z`}
        fill="url(#chairBody)"
        stroke="rgba(255,20,100,0.25)"
        strokeWidth={1}
      />
      {/* ─── Right Armrest ─── */}
      <Path
        d={`M${seatRight + 2} ${seatTop + 2} H${seatRight + 14} Q${seatRight + 18} ${seatTop + 2} ${seatRight + 18} ${seatTop + 10} V${seatBottom - 4} Q${seatRight + 18} ${seatBottom} ${seatRight + 14} ${seatBottom} H${seatRight} Z`}
        fill="url(#chairBody)"
        stroke="rgba(255,20,100,0.25)"
        strokeWidth={1}
      />

      {/* ─── Footrest (rotated around footPivot) ─── */}
      <G
        origin={`${footPivotX}, ${footPivotY}`}
        rotation={-legrestDeg}
      >
        <Path
          d={`M${footPivotX} ${footPivotY} H${footPivotX + 72} Q${footPivotX + 80} ${footPivotY} ${footPivotX + 80} ${footPivotY + 8} V${footPivotY + 30} Q${footPivotX + 80} ${footPivotY + 38} ${footPivotX + 72} ${footPivotY + 38} H${footPivotX + 4} Q${footPivotX} ${footPivotY + 38} ${footPivotX} ${footPivotY + 30} Z`}
          fill="url(#chairBody)"
          stroke="rgba(255,20,100,0.3)"
          strokeWidth={1}
        />
        {/* Footrest cushion highlight */}
        <Path
          d={`M${footPivotX + 6} ${footPivotY + 4} H${footPivotX + 74} V${footPivotY + 14} Q${footPivotX + 40} ${footPivotY + 18} ${footPivotX + 6} ${footPivotY + 14} Z`}
          fill="rgba(255,255,255,0.04)"
        />
      </G>

      {/* ─── Base legs ─── */}
      {[seatLeft + 10, seatRight - 10].map((x, i) => (
        <Path
          key={i}
          d={`M${x} ${seatBottom + 8} L${x - 5} ${H + 10} M${x} ${seatBottom + 8} L${x + 5} ${H + 10}`}
          stroke="rgba(255,20,100,0.3)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}

      {/* Floor contact dots */}
      {[seatLeft + 5, seatRight - 5].map((x, i) => (
        <Circle key={i} cx={x} cy={H + 10} r={4} fill="rgba(255,20,100,0.2)" />
      ))}
    </Svg>
  );
}

// ─── Custom Slider ────────────────────────────────────────────────────────────

function HapticSlider({
  value,
  label,
  color,
  onValueChange,
}: {
  value: number;
  label: string;
  color: string;
  onValueChange: (v: number) => void;
}) {
  const TRACK_W = SW - 80 - 32;
  const THUMB_R = 14;
  const lastHapticVal = useSharedValue(value);

  const translateX = useSharedValue((value / 100) * (TRACK_W - THUMB_R * 2));

  useEffect(() => {
    translateX.value = withSpring((value / 100) * (TRACK_W - THUMB_R * 2), {
      damping: 18, stiffness: 200,
    });
  }, [value, TRACK_W, translateX]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      const raw = clamp(e.absoluteX - 40 - THUMB_R, 0, TRACK_W - THUMB_R * 2);
      translateX.value = raw;
      const newVal = Math.round((raw / (TRACK_W - THUMB_R * 2)) * 100);

      // Haptic click every ~10 units
      if (Math.abs(newVal - lastHapticVal.value) >= 8) {
        lastHapticVal.value = newVal;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onValueChange(newVal);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_R,
  }));

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Assistant', textAlign: 'right' }}>
          {label}
        </Text>
        <Text style={{ color, fontSize: 13, fontFamily: 'Rubik-Bold', fontWeight: '700' }}>
          {value}%
        </Text>
      </View>
      <View
        style={{
          height: THUMB_R * 2,
          justifyContent: 'center',
        }}
      >
        {/* Track */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[fillStyle, { height: 6, borderRadius: 3, backgroundColor: color }]}
          />
        </View>
        {/* Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              thumbStyle,
              {
                width: THUMB_R * 2,
                height: THUMB_R * 2,
                borderRadius: THUMB_R,
                backgroundColor: color,
                borderWidth: 2,
                borderColor: 'white',
                shadowColor: color,
                shadowOpacity: 0.7,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  );
}

// ─── Heating Selector ─────────────────────────────────────────────────────────

const HEAT_LABELS: Record<HeatingLevel, string> = {
  0: 'כבוי',
  1: 'נמוך 🌡️',
  2: 'בינוני 🔥',
  3: 'גבוה 🔴',
};

const HEAT_COLORS: Record<HeatingLevel, string> = {
  0: 'rgba(255,255,255,0.15)',
  1: '#F59E0B',
  2: '#F97316',
  3: '#EF4444',
};

function HeatingSelector({
  value,
  onChange,
}: {
  value: HeatingLevel;
  onChange: (v: HeatingLevel) => void;
}) {
  return (
    <View>
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Assistant', textAlign: 'right', marginBottom: 10 }}>
        חימום מושב
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        {([0, 1, 2, 3] as HeatingLevel[]).map((level) => {
          const active = value === level;
          const col = HEAT_COLORS[level];
          return (
            <Pressable
              key={level}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onChange(level);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: active ? col : 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: active ? col : 'rgba(255,255,255,0.1)',
                opacity: pressed ? 0.85 : 1,
                shadowColor: active ? col : 'transparent',
                shadowOpacity: active ? 0.6 : 0,
                shadowRadius: 8,
                elevation: active ? 5 : 0,
              })}
            >
              <Text style={{
                fontSize: 11,
                fontFamily: 'Rubik-Bold',
                fontWeight: '700',
                color: active ? 'white' : 'rgba(255,255,255,0.4)',
              }}>
                {HEAT_LABELS[level]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Amenity Toggle ───────────────────────────────────────────────────────────

function AmenityToggle({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: string;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.93); }}
      onPressOut={() => {
        scale.value = withSpring(1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: active ? Colors.seatVIP : 'rgba(255,255,255,0.1)',
            backgroundColor: active ? 'rgba(255,20,100,0.12)' : 'rgba(255,255,255,0.04)',
            paddingVertical: 14,
            paddingHorizontal: 12,
            alignItems: 'center',
            gap: 6,
          },
        ]}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
        <Text style={{
          fontSize: 11,
          fontFamily: 'Assistant',
          fontWeight: '600',
          color: active ? Colors.seatVIP : 'rgba(255,255,255,0.5)',
          textAlign: 'center',
        }}>
          {label}
        </Text>
        {active && (
          <View style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: Colors.seatVIP,
            shadowColor: Colors.seatVIP,
            shadowOpacity: 0.8,
            shadowRadius: 4,
          }} />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

interface VipSeatConfiguratorModalProps {
  visible: boolean;
  seat: Seat | null;
  onClose: () => void;
}

export default function VipSeatConfiguratorModal({
  visible,
  seat,
  onClose,
}: VipSeatConfiguratorModalProps) {
  const { getSeatConfig, updateSeatConfig } = useVipCustomStore();

  const cfg = seat ? getSeatConfig(seat.row, seat.number) : {
    reclineAngle: 0, legRestAngle: 0, heatingLevel: 0 as HeatingLevel,
    hasBlanket: false, hasPillow: false,
  };

  // Overlay animation
  const overlayOpacity = useSharedValue(0);
  const sheetY = useSharedValue(60);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
      sheetY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      sheetY.value = withTiming(60, { duration: 220 });
    }
  }, [visible, overlayOpacity, sheetY]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
    opacity: overlayOpacity.value,
  }));

  const patch = useCallback((p: Partial<VipSeatConfig>) => {
    if (seat) updateSeatConfig(seat.row, seat.number, p);
  }, [seat, updateSeatConfig]);

  // Sequenced haptic motor simulation
  const runSensoryTest = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(r => setTimeout(r, 200));
    for (let i = 0; i < 3; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(r => setTimeout(r, 120));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 80));
    }
    await new Promise(r => setTimeout(r, 160));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!seat) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[overlayStyle, { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' }]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Sheet */}
        <Animated.View
          style={[
            sheetStyle,
            {
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              overflow: 'hidden',
              maxHeight: '92%',
            },
          ]}
        >
          <BlurView intensity={85} tint="dark" style={{ flex: 1 }}>
            {/* Glass border accent */}
            <LinearGradient
              colors={['rgba(255,20,100,0.4)', 'rgba(255,20,100,0)']}
              style={{
                height: 2,
                width: '100%',
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
              }}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Pressable
                  onPress={onClose}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, lineHeight: 18 }}>✕</Text>
                </Pressable>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontFamily: 'Rubik-Bold', fontWeight: '700',
                    fontSize: 20, color: 'white', textAlign: 'right',
                  }}>
                    מושב VIP 👑
                  </Text>
                  <Text style={{ fontFamily: 'Assistant', fontSize: 13, color: Colors.seatVIP, textAlign: 'right' }}>
                    שורה {seat.row} • מושב {seat.number}
                  </Text>
                </View>
              </View>

              {/* Live SVG Chair */}
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <SeatSvgIllustration
                  recline={cfg.reclineAngle}
                  legRest={cfg.legRestAngle}
                  heatingLevel={cfg.heatingLevel}
                />
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 16 }} />

              {/* Recline Slider */}
              <HapticSlider
                label="זווית משענת"
                value={cfg.reclineAngle}
                color={Colors.seatVIP}
                onValueChange={(v) => patch({ reclineAngle: v })}
              />

              {/* Leg Rest Slider */}
              <HapticSlider
                label="הדום רגליים"
                value={cfg.legRestAngle}
                color={Colors.secondary}
                onValueChange={(v) => patch({ legRestAngle: v })}
              />

              {/* Heating */}
              <View style={{ marginBottom: 20 }}>
                <HeatingSelector
                  value={cfg.heatingLevel}
                  onChange={(v) => patch({ heatingLevel: v })}
                />
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 4 }} />

              {/* Amenities */}
              <Text style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 12,
                fontFamily: 'Assistant', textAlign: 'right', marginBottom: 12, marginTop: 12,
              }}>
                אביזרים נלווים
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                <AmenityToggle
                  icon="🛏️"
                  label="שמיכת פליז"
                  active={cfg.hasBlanket}
                  onToggle={() => patch({ hasBlanket: !cfg.hasBlanket })}
                />
                <AmenityToggle
                  icon="🪫"
                  label="כרית צוואר"
                  active={cfg.hasPillow}
                  onToggle={() => patch({ hasPillow: !cfg.hasPillow })}
                />
              </View>

              {/* Sensory Test CTA */}
              <Pressable
                onPress={runSensoryTest}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
              >
                <LinearGradient
                  colors={[Colors.seatVIP, '#9B1B30']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 18,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                  <Text style={{
                    fontFamily: 'Rubik-Bold', fontWeight: '700',
                    fontSize: 16, color: 'white',
                  }}>
                    נסה את המושב
                  </Text>
                </LinearGradient>
              </Pressable>
              <Text style={{
                fontSize: 10, color: 'rgba(255,255,255,0.3)',
                fontFamily: 'Assistant', textAlign: 'center', marginTop: 8,
              }}>
                מדמה את תנועת המנועים של מושב ה-VIP
              </Text>
            </ScrollView>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
