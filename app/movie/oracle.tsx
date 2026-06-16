import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Coins, HelpCircle, CheckCircle, Clock, Percent, ShieldCheck, Trophy, Sparkles } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  FadeInDown
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useOracleStore, IPredictionPrompt } from '@/store/useOracleStore';
import { useAuthStore } from '@/store/useAuthStore';

const WHEEL_SIZE = 180;

export default function CineOracleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const movieId = parseInt(params.movieId as string) || 0;
  const movieTitle = (params.movieTitle as string) || 'סרט קולנוע';
  const genres = (params.genres as string) || 'Drama';

  const user = useAuthStore(state => state.user);
  const userPoints = user?.loyaltyPoints || 0;

  const {
    predictions,
    userBets,
    isLoading,
    fetchPredictions,
    fetchUserBets,
    placeBet
  } = useOracleStore();

  const [selectedPrompt, setSelectedPrompt] = useState<IPredictionPrompt | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reanimated values for the wheel spin
  const wheelRotation = useSharedValue(0);

  useEffect(() => {
    if (movieId) {
      fetchPredictions(movieId, movieTitle, genres);
      fetchUserBets();
    }
  }, [movieId, movieTitle, genres, fetchPredictions, fetchUserBets]);

  useEffect(() => {
    if (predictions.length > 0 && !selectedPrompt) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setSelectedPrompt(predictions[0]);
    }
  }, [predictions, selectedPrompt]);

  const spinWheel = (optionIdx: number) => {
    setSelectedOptionIndex(optionIdx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Rotate 180deg per option for a binary wheel
    wheelRotation.value = withSpring(optionIdx * 180, {
      damping: 12,
      stiffness: 90
    });
  };

  const handlePlaceBet = async () => {
    if (!selectedPrompt) return;
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const chosenOption = selectedPrompt.options[selectedOptionIndex];
    const chosenOdds = selectedPrompt.odds[selectedOptionIndex];

    const result = await placeBet(
      movieId,
      selectedPrompt.id,
      selectedPrompt.question,
      chosenOption,
      betAmount,
      chosenOdds
    );

    setIsSubmitting(false);
    if (result.success) {
      alert('הניחוש שלך ננעל במערכת! בהצלחה!');
      fetchUserBets();
    } else {
      alert(result.message || 'שגיאה בשליחת הניחוש');
    }
  };

  const wheelAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${wheelRotation.value}deg` }]
    };
  });

  const activeBetsForMovie = userBets.filter(b => b.movieId === movieId);

  return (
    <View style={styles.container}>
      {/* Premium Navbar */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>CineOracle - חזאי עלילה</Text>
        <View style={styles.pointsBadge}>
          <Coins size={14} color={Colors.secondary} />
          <Text style={styles.pointsText}>{userPoints}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} style={styles.scrollView}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.infoCard}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255, 20, 100, 0.15)', 'rgba(9, 9, 11, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.infoCardContent}>
            <View style={styles.infoCardHeader}>
              <Trophy size={18} color={Colors.primary} />
              <Text style={styles.infoTitle}>חזאי עלילה קולנועי</Text>
            </View>
            <Text style={styles.infoDesc}>נחש תפניות עלילה דרמטיות בעזרת נקודות CinePass. סובב את גלגל הניחושים, נעל את הקופה ואתרג את האינטואיציה שלך!</Text>
          </View>
        </Animated.View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Prompts list */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={16} color={Colors.secondary} />
                <Text style={styles.sectionTitle}>שאלות פתוחות לניחוש</Text>
              </View>
              {predictions.map((p) => {
                const alreadyBet = userBets.some(b => b.predictionId === p.id);
                const isActive = selectedPrompt?.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      if (!alreadyBet) {
                        setSelectedPrompt(p);
                        spinWheel(0);
                      }
                    }}
                    style={[
                      styles.promptCard,
                      isActive && styles.promptCardActive,
                      alreadyBet && styles.promptCardDisabled
                    ]}
                  >
                    {isActive ? (
                      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    ) : (
                      <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                    )}
                    <View style={styles.promptCardContent}>
                      <View style={styles.promptHeader}>
                        {alreadyBet ? (
                          <CheckCircle size={18} color={Colors.success} />
                        ) : (
                          <HelpCircle size={18} color={isActive ? Colors.secondary : Colors.textSecondary} />
                        )}
                        <Text style={[styles.promptQuestion, isActive && styles.promptQuestionActive]}>{p.question}</Text>
                      </View>
                      {alreadyBet && (
                        <Text style={styles.alreadyBetText}>כבר ביצעת ניחוש לשאלה זו</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Interactive Betting Section */}
            {selectedPrompt && !userBets.some(b => b.predictionId === selectedPrompt.id) && (
              <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.bettingBox}>
                <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.04)', 'rgba(0, 0, 0, 0.2)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.bettingBoxContent}>
                  <Text style={styles.questionHighlight}>{selectedPrompt.question}</Text>

                  {/* Animated Prediction Wheel */}
                  <View style={styles.wheelWrapper}>
                    <View style={styles.wheelOuterRing}>
                      <Animated.View style={[styles.wheel, wheelAnimatedStyle]}>
                        <LinearGradient
                          colors={[Colors.primary, '#800A30']}
                          style={[styles.wheelSegment, styles.segmentLeft]}
                        >
                          <Text style={styles.segmentText}>{selectedPrompt.options[0]}</Text>
                          <View style={styles.oddsBadge}>
                            <Text style={styles.segmentOdds}>x{selectedPrompt.odds[0].toFixed(2)}</Text>
                          </View>
                        </LinearGradient>
                        <LinearGradient
                          colors={['#1E1E21', '#121214']}
                          style={[styles.wheelSegment, styles.segmentRight]}
                        >
                          <Text style={styles.segmentText}>{selectedPrompt.options[1]}</Text>
                          <View style={styles.oddsBadge}>
                            <Text style={styles.segmentOdds}>x{selectedPrompt.odds[1].toFixed(2)}</Text>
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    </View>

                    {/* Neon pointer */}
                    <View style={styles.pointerContainer}>
                      <View style={styles.pointerGlow} />
                      <View style={styles.pointerArrow} />
                    </View>
                  </View>

                  {/* Toggle controls */}
                  <View style={styles.toggleContainer}>
                    {selectedPrompt.options.map((opt, idx) => {
                      const isActive = selectedOptionIndex === idx;
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => spinWheel(idx)}
                          style={[
                            styles.toggleButton,
                            isActive && styles.toggleButtonActive
                          ]}
                        >
                          {isActive && (
                            <LinearGradient
                              colors={['rgba(255, 20, 100, 0.2)', 'rgba(255, 20, 100, 0.05)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={StyleSheet.absoluteFill}
                            />
                          )}
                          <Text style={[
                            styles.toggleButtonText,
                            isActive && styles.toggleButtonTextActive
                          ]}>
                            {opt} (x{selectedPrompt.odds[idx].toFixed(2)})
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Points selector */}
                  <Text style={styles.label}>כמות נקודות להשקעה:</Text>
                  <View style={styles.pointsSelector}>
                    {[10, 50, 100, 250].map((amt) => {
                      const isActive = betAmount === amt;
                      return (
                        <Pressable
                          key={amt}
                          onPress={() => {
                            setBetAmount(amt);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={[
                            styles.amountBtn,
                            isActive && styles.amountBtnActive
                          ]}
                        >
                          {isActive && (
                            <LinearGradient
                              colors={['rgba(229, 255, 0, 0.25)', 'rgba(229, 255, 0, 0.05)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={StyleSheet.absoluteFill}
                            />
                          )}
                          <Text style={[
                            styles.amountBtnText,
                            isActive && styles.amountBtnTextActive
                          ]}>
                            {amt}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.potentialWinBox}>
                    <Text style={styles.winLabel}>פוטנציאל זכייה:</Text>
                    <Text style={styles.winValue}>
                      {Math.round(betAmount * selectedPrompt.odds[selectedOptionIndex])} נקודות
                    </Text>
                  </View>

                  <Pressable
                    onPress={handlePlaceBet}
                    disabled={isSubmitting || userPoints < betAmount}
                    style={[
                      styles.submitBtn,
                      userPoints < betAmount && styles.submitBtnDisabled
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#09090B" />
                    ) : (
                      <LinearGradient
                        colors={userPoints < betAmount ? ['#27272A', '#1E1E21'] : [Colors.primary, '#800A30']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitBtnGradient}
                      >
                        <ShieldCheck size={18} color={userPoints < betAmount ? '#71717A' : '#FFFFFF'} />
                        <Text style={[styles.submitBtnText, userPoints < betAmount && { color: '#71717A' }]}>
                          {userPoints < betAmount ? 'אין מספיק נקודות' : 'נעל ניחוש עלילה'}
                        </Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* User Active Bets List */}
            {activeBetsForMovie.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Trophy size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>הניחושים שלי לסרט זה</Text>
                </View>
                {activeBetsForMovie.map((b) => (
                  <View key={b._id} style={styles.betItem}>
                    <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.betItemContent}>
                      <View style={styles.betStatus}>
                        <Clock size={14} color={Colors.secondary} />
                        <Text style={styles.betStatusText}>ממתין לתוצאה</Text>
                      </View>
                      <View style={styles.betTextContainer}>
                        <Text style={styles.betQuestion}>{b.question}</Text>
                        <Text style={styles.betSelection}>הבחירה שלך: {b.userChoice} (x{b.odds.toFixed(2)})</Text>
                      </View>
                      <View style={styles.betAmountBox}>
                        <Text style={styles.betAmountText}>-{b.betAmount} נק'</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B'
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(18,18,20,0.4)'
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7'
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 0, 0.2)'
  },
  pointsText: {
    color: '#E5FF00',
    fontFamily: 'Inter-Bold',
    fontSize: 13
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24
  },
  infoCard: {
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden'
  },
  infoCardContent: {
    padding: 20,
    alignItems: 'flex-start'
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#FF1464',
    textAlign: 'left'
  },
  infoDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#A1A1AA',
    textAlign: 'left',
    lineHeight: 18
  },
  section: {
    marginTop: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7',
    textAlign: 'left'
  },
  promptCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
    overflow: 'hidden'
  },
  promptCardContent: {
    padding: 18,
    alignItems: 'flex-start'
  },
  promptCardActive: {
    borderColor: 'rgba(229, 255, 0, 0.3)',
    shadowColor: '#E5FF00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6
  },
  promptCardDisabled: {
    opacity: 0.5
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  promptQuestion: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#E4E4E7',
    flex: 1,
    textAlign: 'left'
  },
  promptQuestionActive: {
    color: '#E5FF00'
  },
  alreadyBetText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#E5FF00',
    marginTop: 4,
    textAlign: 'left'
  },
  bettingBox: {
    marginTop: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden'
  },
  bettingBoxContent: {
    padding: 24,
    alignItems: 'stretch'
  },
  questionHighlight: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#E5FF00',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22
  },
  wheelWrapper: {
    height: WHEEL_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12
  },
  wheelOuterRing: {
    width: WHEEL_SIZE + 16,
    height: WHEEL_SIZE + 16,
    borderRadius: (WHEEL_SIZE + 16) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    flexDirection: 'row'
  },
  wheelSegment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8
  },
  segmentLeft: {
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  segmentRight: {},
  segmentText: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#FAFAF7',
    textAlign: 'center'
  },
  oddsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8
  },
  segmentOdds: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#E5FF00'
  },
  pointerContainer: {
    position: 'absolute',
    top: 6,
    alignItems: 'center',
    zIndex: 10
  },
  pointerGlow: {
    position: 'absolute',
    top: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5FF00',
    opacity: 0.35,
    shadowColor: '#E5FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12
  },
  pointerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: 'transparent',
    borderBottomWidth: 14,
    borderBottomColor: '#E5FF00',
    transform: [{ rotate: '180deg' }]
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16
  },
  toggleButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  toggleButtonActive: {
    borderColor: 'rgba(255, 20, 100, 0.45)',
    shadowColor: '#FF1464',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  toggleButtonText: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#A1A1AA'
  },
  toggleButtonTextActive: {
    color: '#FF1464',
    fontFamily: 'Rubik-Bold'
  },
  label: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#A1A1AA',
    marginBottom: 10,
    textAlign: 'left'
  },
  pointsSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20
  },
  amountBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  amountBtnActive: {
    borderColor: 'rgba(229, 255, 0, 0.4)',
    shadowColor: '#E5FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3
  },
  amountBtnText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: '#71717A'
  },
  amountBtnTextActive: {
    color: '#E5FF00'
  },
  potentialWinBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
    alignItems: 'center'
  },
  winLabel: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#71717A'
  },
  winValue: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#E5FF00'
  },
  submitBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF1464',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6
  },
  submitBtnGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20
  },
  submitBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF'
  },
  betItem: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
    overflow: 'hidden'
  },
  betItemContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  betStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 95
  },
  betStatusText: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    color: '#E5FF00'
  },
  betTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'flex-start'
  },
  betQuestion: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7',
    textAlign: 'left'
  },
  betSelection: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#71717A',
    marginTop: 2,
    textAlign: 'left'
  },
  betAmountBox: {
    alignItems: 'flex-start',
    width: 60
  },
  betAmountText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FF1464'
  }
});
