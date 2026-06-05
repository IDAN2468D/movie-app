import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, Layout, ZoomIn } from 'react-native-reanimated';
import { Trophy, CheckCircle2, XCircle, HelpCircle, Sparkles, Award, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useAuthStore } from '@/store/useAuthStore';
import { getTriviaForMovie } from '@/utils/triviaData';

interface MovieTriviaProps {
  movieTitle: string;
  movieId: number;
  themeColors: {
    primary: string;
    secondary: string;
  };
}

export default function MovieTrivia({ movieTitle, movieId, themeColors }: MovieTriviaProps) {
  const { user, addLoyaltyPoints, isAuthenticated } = useAuthStore();
  
  // Check if user has already completed trivia for this movie in their synced backend profile
  const hasCompletedAlready = useMemo(() => {
    if (!user?.loyaltyActivity) return false;
    const actionKey = `חידון קולנוע: ${movieTitle}`;
    return user.loyaltyActivity.some(act => act.action === actionKey);
  }, [user, movieTitle]);

  const questions = useMemo(() => getTriviaForMovie(movieTitle), [movieTitle]);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isSubmittingPoints, setIsSubmittingPoints] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIdx];

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGameState('playing');
    setCurrentQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setCorrectAnswersCount(0);
    setPointsAwarded(false);
    setErrorMessage(null);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswerIdx !== null) return; // Prevent double answer selection
    
    setSelectedAnswerIdx(index);
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectAnswersCount(prev => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswerIdx(null);
    } else {
      setGameState('completed');
    }
  };

  const claimPoints = async () => {
    if (pointsAwarded || isSubmittingPoints) return;
    
    // Require at least 2 correct answers out of 3 to win points
    const passingScore = Math.ceil(questions.length / 2);
    if (correctAnswersCount < passingScore) {
      setErrorMessage("מצטערים, יש לענות נכון על רוב השאלות כדי לזכות בנקודות.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmittingPoints(true);
    setErrorMessage(null);
    
    const actionName = `חידון קולנוע: ${movieTitle}`;
    // Award 50 points
    const rewardPoints = 50;

    try {
      const result = await addLoyaltyPoints(actionName, rewardPoints);
      if (result.success) {
        setPointsAwarded(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setErrorMessage(result.message || 'שגיאה בעדכון הנקודות בשרת');
      }
    } catch {
      setErrorMessage('שגיאת חיבור לשרת. אנא נסה שנית.');
    } finally {
      setIsSubmittingPoints(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show trivia to unauthenticated guests
  }

  return (
    <Animated.View 
      entering={FadeInDown.delay(100).springify()}
      layout={Layout.springify()}
      className="mt-8 overflow-hidden rounded-[32px] border border-white/5 bg-[#121214]/90"
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      
      {gameState === 'idle' && (
        <View className="p-8">
          <View className="flex-row items-center mb-6 gap-4" style={{ flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse' }}>
            <View className="p-3 rounded-2xl" style={{ backgroundColor: `${themeColors.primary}22` }}>
              <HelpCircle size={24} color={themeColors.primary} />
            </View>
            <View style={{ alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start', flex: 1 }}>
              <Text className="text-h2 text-white font-display" style={{ alignSelf: 'stretch', textAlign: 'left', writingDirection: 'rtl' }}>חידון טריוויה קולנועי</Text>
              <Text className="text-caption text-textSecondary uppercase tracking-widest font-label" style={{ alignSelf: 'stretch', textAlign: 'left', writingDirection: 'ltr' }}>CINETRIVIA QUEST</Text>
            </View>
          </View>

          {hasCompletedAlready ? (
            <View className="bg-emerald-500/10 border border-emerald-500/25 p-5 rounded-2xl mb-4 items-center">
              <CheckCircle2 size={36} color={Colors.success} className="mb-2" />
              <Text className="text-white font-bold font-body text-base mb-1" style={{ textAlign: 'center', writingDirection: 'rtl' }}>השלמת את האתגר!</Text>
              <Text className="text-textSecondary text-xs font-body text-center leading-relaxed" style={{ textAlign: 'center', writingDirection: 'rtl' }}>
                ענית על חידון הטריוויה עבור '{movieTitle}' וקיבלת 50 נקודות מועדון CinePass.
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-textSecondary font-body text-[14px] leading-relaxed mb-6" style={{ alignSelf: 'stretch', textAlign: 'left', writingDirection: 'rtl', width: '100%' }}>
                בחן את הידע שלך על הסרט '{movieTitle}'! ענה נכון על לפחות 2 שאלות מתוך 3 וזכה ב-50 נקודות מועדון למימוש הטבות.
              </Text>

              <Pressable
                onPress={handleStart}
                className="rounded-2xl overflow-hidden shadow-lg shadow-primary/20"
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <LinearGradient
                  colors={[themeColors.primary, '#8B152A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 items-center justify-center flex-row gap-2"
                >
                  <Trophy size={18} color="white" />
                  <Text className="text-white font-bold text-sm font-display">התחל באתגר הטריוויה</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {gameState === 'playing' && currentQuestion && (
        <View className="p-8">
          {/* Header Progress */}
          <View className="flex-row justify-between items-center mb-6" style={{ flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse' }}>
            <Text className="text-textMuted text-xs font-body" style={{ textAlign: 'right', writingDirection: 'rtl' }}>
              שאלה {currentQuestionIdx + 1} מתוך {questions.length}
            </Text>
            <View className="flex-row gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
              <Sparkles size={12} color={themeColors.secondary} />
              <Text className="text-white text-[10px] font-bold" style={{ color: themeColors.secondary, writingDirection: 'rtl' }}>+50 נקודות</Text>
            </View>
          </View>
 
          {/* Progress Bar */}
          <View className="h-1.5 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
            <View 
              className="h-full rounded-full" 
              style={{ 
                width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`,
                backgroundColor: themeColors.primary
              }} 
            />
          </View>
 
          {/* Question Text */}
          <View style={{ width: '100%', alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start' }}>
            <Text className="text-white text-base font-bold font-body mb-6 leading-relaxed" style={{ textAlign: 'left', writingDirection: 'rtl', width: '100%' }}>
              {currentQuestion.question}
            </Text>
          </View>
 
          {/* Options List */}
          <View className="gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswerIdx === index;
              const isCorrectAnswer = index === currentQuestion.correctAnswerIndex;
              const hasAnswered = selectedAnswerIdx !== null;
              
              let buttonBg = 'rgba(255, 255, 255, 0.03)';
              let borderColor = 'rgba(255, 255, 255, 0.08)';
              let textColor = '#FFFFFF';
              
              if (hasAnswered) {
                if (isCorrectAnswer) {
                  buttonBg = 'rgba(34, 197, 94, 0.15)'; // Success green
                  borderColor = 'rgba(34, 197, 94, 0.4)';
                  textColor = '#4ade80';
                } else if (isSelected) {
                  buttonBg = 'rgba(239, 68, 68, 0.15)'; // Error red
                  borderColor = 'rgba(239, 68, 68, 0.4)';
                  textColor = '#f87171';
                } else {
                  buttonBg = 'rgba(255, 255, 255, 0.01)';
                  borderColor = 'rgba(255, 255, 255, 0.03)';
                  textColor = 'rgba(255, 255, 255, 0.3)';
                }
              }
              
              return (
                <Pressable
                  key={index}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={hasAnswered}
                  style={{ backgroundColor: buttonBg, borderColor, flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse' }}
                  className="p-4 rounded-xl border flex-row items-center gap-3"
                >
                  {hasAnswered && isCorrectAnswer && (
                    <Animated.View entering={ZoomIn.duration(300)}>
                      <CheckCircle2 size={18} color="#4ade80" />
                    </Animated.View>
                  )}
                  {hasAnswered && isSelected && !isCorrectAnswer && (
                    <Animated.View entering={ZoomIn.duration(300)}>
                      <XCircle size={18} color="#f87171" />
                    </Animated.View>
                  )}
                  {!hasAnswered && (
                    <View className="w-5 h-5 rounded-full border border-white/20 items-center justify-center">
                      <Text className="text-[10px] text-white/40">{index + 1}</Text>
                    </View>
                  )}
                  <Text className="text-[14px] font-body" style={{ color: textColor, textAlign: 'right', writingDirection: 'rtl' }}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
 
          {/* Explanation & Feedback */}
          {selectedAnswerIdx !== null && (() => {
            const isCorrect = selectedAnswerIdx === currentQuestion.correctAnswerIndex;
            const isLastQuestion = currentQuestionIdx === questions.length - 1;
            
            return (
              <Animated.View 
                entering={FadeInDown.duration(400)}
                className="mt-6 rounded-[24px] border overflow-hidden"
                style={{ 
                  borderColor: isCorrect ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                  backgroundColor: isCorrect ? '#15261C' : '#281A1C',
                  shadowColor: isCorrect ? '#22c55e' : '#ef4444',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.12,
                  shadowRadius: 12,
                  elevation: 4,
                  width: '100%'
                }}
              >
                <View className="p-5">
                  {/* Status Badge */}
                  <View 
                    className="flex-row items-center gap-2 mb-3 px-3 py-1.5 rounded-full border" 
                    style={{ 
                      flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
                      alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
                      backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      borderColor: isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    {isCorrect ? (
                      <CheckCircle2 size={15} color="#4ade80" />
                    ) : (
                      <XCircle size={15} color="#f87171" />
                    )}
                    <Text 
                      className="text-[12px] font-bold" 
                      style={{ 
                        color: isCorrect ? '#4ade80' : '#f87171', 
                        fontFamily: 'Rubik-Medium' 
                      }}
                    >
                      {isCorrect ? 'נכון מאוד! 🎉' : 'לא בדיוק... 😅'}
                    </Text>
                  </View>

                  {/* Explanation Text */}
                  <Text 
                    className="text-zinc-200 text-[14px] leading-relaxed mb-5" 
                    style={{ 
                      fontFamily: 'Assistant-Regular', 
                      textAlign: 'left', 
                      writingDirection: 'rtl',
                      alignSelf: 'stretch' 
                    }}
                  >
                    {currentQuestion.explanation}
                  </Text>
     
                  {/* Next / Finish Button */}
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <Pressable
                      onPress={handleNext}
                      style={({ pressed }) => [
                        { 
                          transform: [{ scale: pressed ? 0.97 : 1 }],
                          borderRadius: 16,
                          overflow: 'hidden'
                        }
                      ]}
                    >
                      {isLastQuestion ? (
                        <LinearGradient
                          colors={[themeColors.primary, themeColors.secondary || '#9B1B30']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className="py-3.5 px-12 items-center justify-center flex-row"
                        >
                          <Text 
                            className="text-white font-bold text-sm" 
                            style={{ fontFamily: 'Rubik-Bold', textAlign: 'center' }}
                          >
                            סיים חידון
                          </Text>
                          <ArrowRight size={16} color="white" style={{ position: 'absolute', left: 16, transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
                        </LinearGradient>
                      ) : (
                        <View 
                          className="py-3.5 px-12 bg-white/10 border border-white/10 items-center justify-center flex-row"
                          style={{ borderRadius: 16 }}
                        >
                          <Text 
                            className="text-white font-bold text-sm" 
                            style={{ fontFamily: 'Rubik-Medium', textAlign: 'center' }}
                          >
                            לשאלה הבאה
                          </Text>
                          <ArrowRight size={16} color="white" style={{ position: 'absolute', left: 16, transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
                        </View>
                      )}
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            );
          })()}
        </View>
      )}

      {gameState === 'completed' && (
        <View className="p-8 items-center">
          <Animated.View 
            entering={ZoomIn.delay(100).duration(500)}
            className="w-20 h-20 rounded-full items-center justify-center mb-6 shadow-xl"
            style={{ 
              backgroundColor: `${themeColors.primary}22`,
              shadowColor: themeColors.primary,
              shadowOpacity: 0.2,
              shadowRadius: 10
            }}
          >
            <Award size={40} color={themeColors.primary} />
          </Animated.View>

          <Text className="text-white text-h2 font-display text-center mb-2" style={{ textAlign: 'center', writingDirection: 'rtl' }}>
            החידון הושלם!
          </Text>
 
          {/* Score details */}
          <Text className="text-textSecondary font-body text-[14px] text-center mb-6 leading-relaxed" style={{ textAlign: 'center', writingDirection: 'rtl' }}>
            ענית נכון על <Text className="text-white font-bold">{correctAnswersCount}</Text> מתוך <Text className="text-white font-bold">{questions.length}</Text> שאלות.
          </Text>
 
          {correctAnswersCount >= Math.ceil(questions.length / 2) ? (
            <View className="w-full items-center">
              {!pointsAwarded ? (
                <View className="w-full items-center">
                  <Text className="text-emerald-400 font-bold font-body text-xs text-center mb-6 leading-relaxed" style={{ textAlign: 'center', writingDirection: 'rtl' }}>
                    עברת את המבחן בהצלחה! לחץ כאן לקבלת 50 נקודות מועדון.
                  </Text>
                  
                  {errorMessage && (
                    <Text className="text-red-500 text-xs font-body text-center mb-4" style={{ textAlign: 'center', writingDirection: 'rtl' }}>
                      {errorMessage}
                    </Text>
                  )}
 
                  <Pressable
                    onPress={claimPoints}
                    disabled={isSubmittingPoints}
                    className="w-full rounded-2xl overflow-hidden"
                    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                  >
                    <LinearGradient
                      colors={[Colors.secondary, '#1B9B53']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="py-4 items-center justify-center flex-row gap-2"
                    >
                      {isSubmittingPoints ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <>
                          <Trophy size={18} color={Colors.background} />
                          <Text className="text-background font-bold text-sm font-display">אסוף 50 נקודות CinePass</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : (
                <Animated.View 
                  entering={ZoomIn.duration(400)}
                  className="w-full bg-emerald-500/10 border border-emerald-500/25 p-5 rounded-2xl items-center"
                >
                  <Sparkles size={24} color={Colors.secondary} className="mb-2" />
                  <Text className="text-secondary font-bold font-body text-sm mb-1 text-center" style={{ textAlign: 'center', writingDirection: 'rtl' }}>הנקודות נוספו בהצלחה!</Text>
                  <Text className="text-white/80 text-xs font-body text-center leading-relaxed" style={{ textAlign: 'center', writingDirection: 'rtl' }}>
                    קיבלת +50 נקודות לחשבונך. תוכל לראות אותן בלוח הבקרה ובארנק ההטבות.
                  </Text>
                </Animated.View>
              )}
            </View>
          ) : (
            <View className="w-full">
              <Text className="text-red-400 font-bold font-body text-xs text-center mb-6 leading-relaxed" style={{ textAlign: 'center', writingDirection: 'rtl' }}>
                לא ענית נכון על מספיק שאלות כדי לזכות בנקודות. נסה שוב!
              </Text>
              
              <Pressable
                onPress={handleStart}
                className="w-full py-4 bg-white/10 rounded-2xl border border-white/10 items-center justify-center"
                style={({ pressed }) => [pressed && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              >
                <Text className="text-white font-bold text-sm font-display">נסה שוב</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => setGameState('idle')}
            className="mt-4 py-2"
            hitSlop={15}
          >
            <Text className="text-textMuted text-xs font-body">חזרה לתפריט הראשי</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}
