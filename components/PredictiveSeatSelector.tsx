import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Sparkles, Check, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useBookingStore, type Seat } from '@/store/useBookingStore';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';

interface RecommendationMode {
  id: string;
  name: string;
  description: string;
}

const RECOMMENDATION_MODES: RecommendationMode[] = [
  { id: 'vip', name: 'מרכז ה-VIP ⭐', description: 'חוויית פרימיום בשורות האחרונות' },
  { id: 'sweet', name: 'הסוויט ספוט 🎯', description: 'זווית הצפייה והסאונד האופטימלית' },
  { id: 'panoramic', name: 'מבט פנורמי 🔭', description: 'שורה אחורית לראייה רחבה' },
  { id: 'closeup', name: 'קרוב למסך 🎬', description: 'חוויה עוצמתית בשורה הראשונה' },
];

function getRecommendedSeats(seats: Seat[][], count: number, modeId: string): { row: string; number: number }[] {
  if (!seats || seats.length === 0) return [];
  const rowsCount = seats.length;
  const colsCount = seats[0].length;
  const centerCol = colsCount / 2;

  let targetRowIndices: number[] = [];
  if (modeId === 'vip') {
    targetRowIndices = [rowsCount - 1, rowsCount - 2];
  } else if (modeId === 'sweet') {
    targetRowIndices = [
      Math.floor(rowsCount * 0.5), 
      Math.floor(rowsCount * 0.5) - 1, 
      Math.floor(rowsCount * 0.5) + 1
    ];
  } else if (modeId === 'panoramic') {
    targetRowIndices = [rowsCount - 3, rowsCount - 4];
  } else if (modeId === 'closeup') {
    targetRowIndices = [0, 1];
  }

  targetRowIndices = targetRowIndices.filter(i => i >= 0 && i < rowsCount);
  if (targetRowIndices.length === 0) {
    targetRowIndices = Array.from({ length: rowsCount }, (_, i) => i);
  }

  let bestCluster: Seat[] = [];
  let bestScore = Infinity;

  for (const rowIndex of targetRowIndices) {
    const row = seats[rowIndex];
    for (let startCol = 0; startCol <= colsCount - count; startCol++) {
      const candidate: Seat[] = [];
      let allAvailable = true;

      for (let i = 0; i < count; i++) {
        const seat = row[startCol + i];
        if (seat.status === 'taken') {
          allAvailable = false;
          break;
        }
        candidate.push(seat);
      }

      if (allAvailable) {
        const avgColIndex = startCol + (count - 1) / 2;
        const score = Math.abs(avgColIndex - centerCol);
        if (score < bestScore) {
          bestScore = score;
          bestCluster = candidate;
        }
      }
    }
  }

  if (bestCluster.length === 0) {
    const allRowIndices = Array.from({ length: rowsCount }, (_, i) => i);
    for (const rowIndex of allRowIndices) {
      const row = seats[rowIndex];
      for (let startCol = 0; startCol <= colsCount - count; startCol++) {
        const candidate: Seat[] = [];
        let allAvailable = true;

        for (let i = 0; i < count; i++) {
          const seat = row[startCol + i];
          if (seat.status === 'taken') {
            allAvailable = false;
            break;
          }
          candidate.push(seat);
        }

        if (allAvailable) {
          const avgColIndex = startCol + (count - 1) / 2;
          const score = Math.abs(avgColIndex - centerCol);
          if (score < bestScore) {
            bestScore = score;
            bestCluster = candidate;
          }
        }
      }
    }
  }

  if (bestCluster.length === 0) {
    const flatAvailable = seats.flat().filter(s => s.status !== 'taken');
    bestCluster = flatAvailable.slice(0, count);
  }

  return bestCluster.map(s => ({ row: s.row, number: s.number }));
}

export default function PredictiveSeatSelector() {
  const { seats, selectedSeats, selectSeatCluster } = useBookingStore();
  const [ticketCount, setTicketCount] = useState<number>(2);
  const [activeMode, setActiveMode] = useState<string>('sweet');
  const [isManualSelection, setIsManualSelection] = useState<boolean>(false);
  const [initialApplied, setInitialApplied] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Animations shared values
  const pulse = useSharedValue<number>(1);
  const popoverProgress = useSharedValue<number>(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [pulse]);

  useEffect(() => {
    popoverProgress.value = withSpring(isOpen ? 1 : 0, {
      damping: 15,
      stiffness: 120,
    });
  }, [isOpen, popoverProgress]);

  const triggerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  const popoverAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: popoverProgress.value,
      transform: [
        { scale: 0.85 + 0.15 * popoverProgress.value },
        { translateX: 15 * (1 - popoverProgress.value) },
      ],
    };
  });

  const applyRecommendation = useCallback((count: number, modeId: string) => {
    if (!seats || seats.length === 0) return;
    const recommended = getRecommendedSeats(seats, count, modeId);
    if (recommended.length > 0) {
      selectSeatCluster(recommended);
      setIsManualSelection(false);
    }
  }, [seats, selectSeatCluster]);

  // Apply initial recommendation ONLY ONCE when seats load
  useEffect(() => {
    if (seats && seats.length > 0 && !initialApplied) {
      const recommended = getRecommendedSeats(seats, ticketCount, activeMode);
      if (recommended.length > 0) {
        selectSeatCluster(recommended);
        setInitialApplied(true);
      }
    }
  }, [seats, initialApplied, ticketCount, activeMode, selectSeatCluster]);

  // Sync state if user manually clicks seats on the interactive map
  useEffect(() => {
    if (selectedSeats.length > 0) {
      // Check if selected seats match the current recommendation
      const recommended = getRecommendedSeats(seats, ticketCount, activeMode);
      const recommendedKeys = new Set(recommended.map(s => `${s.row}-${s.number}`));
      const selectedKeys = new Set(selectedSeats.map(s => `${s.row}-${s.number}`));

      let isMatch = selectedSeats.length === ticketCount;
      if (isMatch) {
        for (const key of selectedKeys) {
          if (!recommendedKeys.has(key)) {
            isMatch = false;
            break;
          }
        }
      }

      if (!isMatch) {
        setIsManualSelection(true);
      } else {
        setIsManualSelection(false);
      }
    } else {
      setIsManualSelection(false);
    }
  }, [selectedSeats, seats, ticketCount, activeMode]);

  const handleTicketCountChange = (count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTicketCount(count);
    applyRecommendation(count, activeMode);
  };

  const handleModeChange = (modeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveMode(modeId);
    applyRecommendation(ticketCount, modeId);
  };

  const handleApplyRecManual = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    applyRecommendation(ticketCount, activeMode);
  };

  return (
    <>
      {/* Tap-to-Dismiss Overlay when Popover is Open */}
      {isOpen && (
        <Pressable 
          style={styles.backdrop} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsOpen(false);
          }}
        />
      )}

      {/* Floating Trigger Button */}
      <Animated.View style={[styles.triggerContainer, triggerAnimatedStyle]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsOpen(!isOpen);
          }}
          style={[
            styles.triggerButton,
            isOpen && styles.triggerButtonActive
          ]}
        >
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
          <Sparkles 
            size={22} 
            color={isOpen ? Colors.white : Colors.primary} 
          />
        </Pressable>
      </Animated.View>

      {/* Glassmorphic Popover Tooltip Card */}
      <Animated.View 
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.popoverContainer, 
          popoverAnimatedStyle
        ]}
      >
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.popoverContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrapper}>
              <Sparkles size={14} color={Colors.secondary} style={styles.sparkleIcon} />
              <Text style={styles.titleText}>הזמנה חכמה ביד אחת 🪄</Text>
            </View>
            <Text style={styles.subtitleText}>בחר כמות כרטיסים וסוג חוויה</Text>
          </View>

          {/* Ticket Count Selector */}
          <View style={styles.ticketSelectorRow}>
            <Text style={styles.selectorLabel}>כרטיסים:</Text>
            <View style={styles.pillContainer}>
              {[1, 2, 3, 4].map((num) => {
                const isSelected = ticketCount === num;
                return (
                  <Pressable
                    key={num}
                    onPress={() => handleTicketCountChange(num)}
                    style={[
                      styles.pillButton,
                      isSelected && styles.pillButtonActive
                    ]}
                  >
                    <View style={styles.pillContent}>
                      <User size={10} color={isSelected ? Colors.white : 'rgba(255,255,255,0.4)'} style={styles.userIcon} />
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{num}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Scrubber Mode Slider */}
          <View style={styles.scrubberWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
            >
              {RECOMMENDATION_MODES.map((mode) => {
                const isSelected = activeMode === mode.id && !isManualSelection;
                return (
                  <Pressable
                    key={mode.id}
                    onPress={() => handleModeChange(mode.id)}
                    style={[
                      styles.modeCard,
                      isSelected && styles.modeCardActive
                    ]}
                  >
                    <Text style={[styles.modeCardName, isSelected && styles.modeCardNameActive]}>
                      {mode.name}
                    </Text>
                    <Text style={styles.modeCardDesc}>
                      {mode.description}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check size={8} color={Colors.white} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Dynamic Recommendation Alert */}
          {isManualSelection && (
            <Pressable onPress={handleApplyRecManual} style={styles.manualSelectionAlert}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.manualAlertText}>הזזת ידנית. לחץ כאן להפעלת בינה מלאכותית מחדש ✨</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    left: -1000,
    top: -1000,
    width: 3000,
    height: 3000,
    backgroundColor: 'transparent',
    zIndex: 98,
  },
  triggerContainer: {
    position: 'absolute',
    right: 16,
    bottom: 230, // easy reach above checkout drawer
    zIndex: 99,
  },
  triggerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 20, 100, 0.4)',
    backgroundColor: 'rgba(18, 18, 20, 0.7)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  triggerButtonActive: {
    borderColor: Colors.white,
    backgroundColor: Colors.primary,
    shadowColor: Colors.white,
    shadowOpacity: 0.2,
  },
  popoverContainer: {
    position: 'absolute',
    right: 80, // immediately to the left of the trigger button
    bottom: 230, // aligned vertically with the trigger
    width: 270,
    zIndex: 99,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(18, 18, 20, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  popoverContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sparkleIcon: {
    marginEnd: 4,
  },
  titleText: {
    fontSize: 13,
    fontFamily: 'Rubik',
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'right',
  },
  subtitleText: {
    fontSize: 10,
    fontFamily: 'Assistant',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
  },
  ticketSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 11,
    fontFamily: 'Rubik',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillButton: {
    minWidth: 34,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginStart: 2,
  },
  pillButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  userIcon: {
    marginEnd: 2,
  },
  pillText: {
    fontSize: 11,
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  pillTextActive: {
    color: Colors.white,
  },
  scrubberWrapper: {
    marginBottom: 2,
  },
  scrollContent: {
    paddingEnd: 10,
    flexDirection: 'row',
  },
  modeCard: {
    width: 110,
    height: 76,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 8,
    marginEnd: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  modeCardActive: {
    backgroundColor: 'rgba(255, 20, 100, 0.08)',
    borderColor: 'rgba(255, 20, 100, 0.3)',
  },
  modeCardName: {
    fontSize: 10,
    fontFamily: 'Rubik',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
    textAlign: 'right',
  },
  modeCardNameActive: {
    color: Colors.primary,
  },
  modeCardDesc: {
    fontSize: 8,
    fontFamily: 'Assistant',
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'right',
    lineHeight: 10,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSelectionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  manualAlertText: {
    fontSize: 9,
    fontFamily: 'Assistant',
    fontWeight: '600',
    color: Colors.secondary,
    textAlign: 'center',
  },
});
