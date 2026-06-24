import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelpCircle, X, Users, Play, Trophy, Sparkles, Check, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { io } from 'socket.io-client';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';

const { width } = Dimensions.get('window');
const TIMER_LIMIT = 15; // 15 seconds limit

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface IPlayer {
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  ready: boolean;
}

interface IQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
}

export default function CineQuizScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  const [lobbyToken, setLobbyToken] = useState('');
  const [inLobby, setInLobby] = useState(false);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'ended'>('lobby');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timerCount, setTimerCount] = useState(TIMER_LIMIT);
  const [isReady, setIsReady] = useState(false);
  const [score, setScore] = useState(0);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  const socketRef = useRef<any>(null);
  const timerInterval = useRef<any>(null);

  // Reanimated values for visual timer
  const strokeOffset = useSharedValue(0);
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: strokeOffset.value,
    };
  });

  useEffect(() => {
    return () => {
      cleanupQuiz();
    };
  }, []);

  const cleanupQuiz = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
  };

  const initializeSocket = (tokenVal: string) => {
    const socketUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketUrl);
    socketRef.current = socket;

    // Listen for players list updates
    socket.on('quiz_players_updated', (updatedPlayers: IPlayer[]) => {
      setPlayers(updatedPlayers);
    });

    // Listen for game start
    socket.on('quiz_started', ({ questions: quizQuestions }: { questions: IQuestion[] }) => {
      setQuestions(quizQuestions);
      setGameState('playing');
      startTimer();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    // Listen for next question
    socket.on('quiz_next_question', ({ currentQuestionIndex: nextIndex }: { currentQuestionIndex: number }) => {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setTimerCount(TIMER_LIMIT);
      startTimer();
    });

    // Listen for game finished
    socket.on('quiz_finished', ({ players: finalPlayers }: { players: IPlayer[] }) => {
      setPlayers(finalPlayers);
      setGameState('ended');
      if (timerInterval.current) clearInterval(timerInterval.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    // Handle connection error
    socket.on('connect_error', () => {
      console.warn('Socket connection failed, entering offline simulation mode.');
      setIsLocalFallback(true);
    });

    // Join room
    socket.emit('join_quiz_room', {
      lobbyToken: tokenVal,
      userId: user?.id || 'offline-id',
      name: user?.name || 'צופה',
    });
  };

  const handleCreateLobby = async () => {
    setLoading(true);
    setErrorMessage('');
    setIsLocalFallback(false);

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/quiz/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ genres: ['Action', 'Drama', 'Sci-Fi'] })
      });

      if (!response.ok) throw new Error('Failed to create quiz');

      const json = await response.json();
      if (json.success) {
        setLobbyToken(json.data.lobbyToken);
        setPlayers(json.data.players);
        setQuestions(json.data.questions);
        setInLobby(true);
        initializeSocket(json.data.lobbyToken);
      }
    } catch (err) {
      console.warn('Failed to connect to API, running offline simulation:', err);
      // Fallback offline setup
      setIsLocalFallback(true);
      const offlineToken = 'LOCAL7';
      setLobbyToken(offlineToken);
      setPlayers([
        { userId: '1', name: user?.name || 'אתה', score: 0, ready: true },
        { userId: '2', name: 'בוט אלון', score: 0, ready: true },
        { userId: '3', name: 'בוט דנה', score: 0, ready: true }
      ]);
      setQuestions([
        {
          questionText: 'מי ביים את הסרט "התחלה" (Inception)?',
          options: ['כריסטופר נולאן', 'סטיבן ספילברג', 'קוונטין טרנטינו', 'ג׳יימס קמרון'],
          correctAnswerIndex: 0,
          points: 100,
        },
        {
          questionText: 'איזה סרט זכה באוסקר לסרט הטוב ביותר בשנת 2020?',
          options: ['1917', 'פרזיטים', 'ג׳וקר', 'היו זמנים בהוליווד'],
          correctAnswerIndex: 1,
          points: 100,
        }
      ]);
      setInLobby(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!lobbyToken) return;
    setLoading(true);
    setErrorMessage('');
    setIsLocalFallback(false);

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/quiz/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lobbyToken,
          name: user?.name || 'משתמש',
        })
      });

      if (!response.ok) throw new Error('חדר המשחק לא נמצא');

      const json = await response.json();
      if (json.success) {
        setPlayers(json.data.players);
        setQuestions(json.data.questions);
        setInLobby(true);
        initializeSocket(lobbyToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'שגיאה בחיבור לחדר המשחק');
    } finally {
      setLoading(false);
    }
  };

  const handleReady = () => {
    setIsReady(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLocalFallback) {
      // Simulate quick countdown start
      setTimeout(() => {
        setGameState('playing');
        startTimer();
      }, 1000);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('player_ready', {
        lobbyToken,
        userId: user?.id,
      });
    }
  };

  const startTimer = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    strokeOffset.value = circumference;

    // Animate circular countdown progress
    strokeOffset.value = withTiming(0, { duration: TIMER_LIMIT * 1000 });

    timerInterval.current = setInterval(() => {
      setTimerCount((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    if (selectedOption === null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSelectedOption(-1); // Lock choices as timeout
    }
    setTimeout(() => {
      triggerNextQuestion();
    }, 2000);
  };

  const triggerNextQuestion = () => {
    if (isLocalFallback) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setTimerCount(TIMER_LIMIT);
        startTimer();
      } else {
        setGameState('ended');
      }
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('next_question', { lobbyToken });
    }
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return; // Prevent double select

    setSelectedOption(index);
    if (timerInterval.current) clearInterval(timerInterval.current);

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = index === currentQ.correctAnswerIndex;

    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = currentQ.points;
      setScore(prev => prev + pointsEarned);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    if (isLocalFallback) {
      setPlayers(prev =>
        prev.map(p =>
          p.userId === '1' ? { ...p, score: p.score + pointsEarned } : p
        )
      );
      setTimeout(() => {
        triggerNextQuestion();
      }, 2000);
    } else {
      if (socketRef.current) {
        socketRef.current.emit('submit_answer', {
          lobbyToken,
          userId: user?.id,
          scoreDelta: pointsEarned,
        });
      }
      setTimeout(() => {
        triggerNextQuestion();
      }, 2000);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CineQuiz AI Arena</Text>
          <View className="w-12" />
        </View>

        {isLocalFallback && (
          <View className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex-row items-center gap-3 mb-4">
            <AlertCircle size={18} color={Colors.warning} />
            <Text style={{ textAlign: 'right', flex: 1 }} className="text-amber-500 text-xs font-semibold">משחק מופעל במצב אופליין מקומי</Text>
          </View>
        )}

        {/* Game Area */}
        {gameState === 'lobby' && !inLobby && (
          <ScrollView contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }} className="flex-1">
            <Animated.View entering={FadeInDown.duration(600).springify()} className="items-center mb-8">
              <View className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 items-center justify-center mb-4">
                <HelpCircle size={44} color={Colors.primary} />
              </View>
              <Text style={{ textAlign: 'center' }} className="text-white text-2xl font-bold mb-2">זירת הטריוויה המשותפת</Text>
              <Text style={{ textAlign: 'center' }} className="text-white/60 text-sm">התחרו עם חברים או שחקו סולו בזירת שאלות AI קולנועיות!</Text>
            </Animated.View>

            {/* Create Lobby Button */}
            <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} className="mb-6">
              <Pressable onPress={handleCreateLobby} className="rounded-2xl overflow-hidden">
                <LinearGradient colors={[Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                  {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-bold">צור חדר משחק חדש</Text>}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Join Section */}
            <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6">
              <Text style={{ textAlign: 'right' }} className="text-white text-base font-bold mb-3">הצטרפות לחדר קיים</Text>
              <TextInput
                value={lobbyToken}
                onChangeText={setLobbyToken}
                placeholder="הקלד קוד חדר (לדוגמה: AB3DEF)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="characters"
                style={{ textAlign: 'right', fontFamily: 'Rubik-Regular' }}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base mb-4"
              />
              {!!errorMessage && <Text className="text-red-500 text-xs mb-3 text-right">{errorMessage}</Text>}
              <Pressable onPress={handleJoinLobby} className="py-3 bg-white/5 border border-white/10 rounded-2xl items-center">
                <Text className="text-white text-base font-semibold">הצטרף לחדר</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        )}

        {/* Lobby Waiting Area */}
        {gameState === 'lobby' && inLobby && (
          <View className="flex-1 justify-between">
            <Animated.View entering={FadeInDown.duration(600).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6">
              <Text style={{ textAlign: 'center' }} className="text-white/40 text-xs mb-1">קוד החדר שלך</Text>
              <Text style={{ textAlign: 'center' }} className="text-white text-3xl font-display font-bold tracking-widest mb-6">{lobbyToken}</Text>
              
              <View className="flex-row-reverse items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <Users size={18} color={Colors.primary} />
                <Text className="text-white text-base font-bold">שחקנים בחדר ({players.length})</Text>
              </View>

              <ScrollView style={{ maxHeight: 200 }}>
                {players.map((p, index) => (
                  <View key={p.userId || index} className="flex-row-reverse items-center justify-between py-3 border-b border-white/5">
                    <Text className="text-white text-base">{p.name}</Text>
                    <View className={`px-3 py-1 rounded-full ${p.ready ? 'bg-secondary/20 border border-secondary/30' : 'bg-white/5 border border-white/10'}`}>
                      <Text className={p.ready ? 'text-secondary text-xs' : 'text-white/40 text-xs'}>
                        {p.ready ? 'מוכן' : 'בהמתנה'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>

            <Pressable onPress={handleReady} disabled={isReady} className="rounded-2xl overflow-hidden mb-6">
              <LinearGradient colors={isReady ? ['#333', '#444'] : [Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                <Text className="text-white text-base font-bold">{isReady ? 'ממתין לשאר השחקנים...' : 'אני מוכן!'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Playing Game Screen */}
        {gameState === 'playing' && questions.length > 0 && (
          <View className="flex-1 justify-between">
            <View>
              {/* Question Header & Timer */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-primary text-base font-bold">שאלה {currentQuestionIndex + 1} מתוך {questions.length}</Text>
                
                {/* SVG Radial Countdown Timer */}
                <View className="relative w-16 h-16 justify-center items-center">
                  <Svg width={50} height={50} viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx="50" cy="50" r={circleRadius} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                    <AnimatedCircle
                      cx="50"
                      cy="50"
                      r={circleRadius}
                      stroke={Colors.primary}
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      animatedProps={animatedProps}
                      fill="transparent"
                    />
                  </Svg>
                  <Text className="absolute text-white font-bold text-sm">{timerCount}</Text>
                </View>
              </View>

              {/* Question Text */}
              <Animated.View entering={FadeInDown.duration(600).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-6 mb-6">
                <Text style={{ textAlign: 'right', lineHeight: 26 }} className="text-white text-lg font-bold">
                  {questions[currentQuestionIndex].questionText}
                </Text>
              </Animated.View>

              {/* Options Stack */}
              <View className="gap-4">
                {questions[currentQuestionIndex].options.map((opt, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = index === questions[currentQuestionIndex].correctAnswerIndex;
                  const showCorrect = selectedOption !== null && isCorrect;
                  const showIncorrect = selectedOption !== null && isSelected && !isCorrect;

                  let borderColor = 'border-white/10';
                  let bgColor = 'bg-surfaceLight';
                  if (showCorrect) {
                    borderColor = 'border-secondary';
                    bgColor = 'bg-secondary/10';
                  } else if (showIncorrect) {
                    borderColor = 'border-primary';
                    bgColor = 'bg-primary/10';
                  } else if (isSelected) {
                    borderColor = 'border-white/40';
                    bgColor = 'bg-white/10';
                  }

                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleSelectOption(index)}
                      disabled={selectedOption !== null}
                      style={{ transform: [{ scale: isSelected ? 0.98 : 1 }] }}
                    >
                      <View className={`w-full border rounded-2xl p-4 flex-row-reverse items-center justify-between ${borderColor} ${bgColor}`}>
                        <Text style={{ textAlign: 'right' }} className="text-white text-base font-semibold flex-1 px-3">{opt}</Text>
                        {showCorrect && <Check size={20} color={Colors.secondary} />}
                        {showIncorrect && <X size={20} color={Colors.primary} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="items-center mb-6">
              <Text className="text-white/40 text-xs">הניקוד שלך: {score} נק׳</Text>
            </View>
          </View>
        )}

        {/* Finished Screen */}
        {gameState === 'ended' && (
          <View className="flex-1 justify-between">
            <Animated.View entering={FadeInDown.duration(600).springify()} className="items-center mb-8 mt-12">
              <Trophy size={60} color={Colors.secondary} className="mb-4 animate-bounce" />
              <Text style={{ textAlign: 'center' }} className="text-white text-2xl font-bold mb-1">המשחק הסתיים!</Text>
              <Text style={{ textAlign: 'center' }} className="text-white/60 text-sm">הטבלה הסופית של המשתתפים</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(150).springify()} className="flex-1 rounded-3xl border border-white/10 bg-surfaceLight p-6 mb-6">
              <ScrollView>
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <View key={p.userId || idx} className="flex-row-reverse items-center justify-between py-4 border-b border-white/5">
                      <View className="flex-row-reverse items-center gap-3">
                        <Text className="text-white/60 font-bold">{idx + 1}.</Text>
                        <Text className="text-white font-bold">{p.name}</Text>
                      </View>
                      <Text className="text-secondary font-bold text-base">{p.score} נק׳</Text>
                    </View>
                  ))}
              </ScrollView>
            </Animated.View>

            <Pressable onPress={() => router.back()} className="rounded-2xl overflow-hidden mb-6">
              <LinearGradient colors={[Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 items-center">
                <Text className="text-white text-base font-bold">חזור לתפריט הראשי</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

      </View>
    </View>
  );
}
