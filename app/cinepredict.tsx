import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, X, Award, Eye, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';

const { width } = Dimensions.get('window');

interface IPrediction {
  _id: string;
  movieTitle: string;
  predictedOpeningWeekend: number;
  predictedRatingScore: number;
  pointsStaked: number;
  isResolved: boolean;
  pointsEarned?: number;
  oracleResponseText?: string;
  createdAt: string;
}

export default function CinePredictScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  const [predictions, setPredictions] = useState<IPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  // Form states
  const [selectedMovie, setSelectedMovie] = useState('מועדון קרב (Fight Club)');
  const [openingWeekend, setOpeningWeekend] = useState(45); // in $ Millions
  const [ratingScore, setRatingScore] = useState(85); // 0-100
  const [stakePoints, setStakePoints] = useState(50);
  const [oracleSays, setOracleSays] = useState('');

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    setIsLocalFallback(false);
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/predictions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('API server unreachable');
      const json = await response.json();
      if (json.success) {
        setPredictions(json.data);
      }
    } catch (err) {
      console.warn('CinePredict API failed, loading offline local predictions:', err);
      setIsLocalFallback(true);
      setPredictions([
        {
          _id: 'pred-1',
          movieTitle: 'חולית: חלק שני (Dune: Part Two)',
          predictedOpeningWeekend: 82,
          predictedRatingScore: 93,
          pointsStaked: 100,
          isResolved: true,
          pointsEarned: 250,
          oracleResponseText: 'האורקל אומר: ניחוש גאוני! חולית ריסק את הקופות בדיוק כפי שחזית. מגיע לך השלל!',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          _id: 'pred-2',
          movieTitle: 'רובוטריקים: ההתחלה',
          predictedOpeningWeekend: 32,
          predictedRatingScore: 88,
          pointsStaked: 50,
          isResolved: false,
          oracleResponseText: 'האורקל אומר: הימור אופטימי מדי עבור רובוטים מצוירים. נחיה ונראה!',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (user && (user.loyaltyPoints || 0) < stakePoints) {
      alert('אין לך מספיק נקודות נאמנות להימור זה');
      return;
    }

    setSubmitLoading(true);
    setOracleSays('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/predictions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tmdbId: 550,
          movieTitle: selectedMovie,
          predictedOpeningWeekend: openingWeekend,
          predictedRatingScore: ratingScore,
          pointsStaked: stakePoints,
        })
      });

      if (!response.ok) throw new Error('API server error');
      const json = await response.json();
      if (json.success) {
        setOracleSays(json.data.oracleResponseText || '');
        // Update user store loyalty points
        if (user && json.userLoyaltyPoints !== undefined) {
          useAuthStore.setState({ user: { ...user, loyaltyPoints: json.userLoyaltyPoints } as any });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchPredictions();
      }
    } catch (err) {
      console.warn('API submission failed, running local oracle simulation:', err);
      // Simulate locally
      setIsLocalFallback(true);
      const simulatedOracle = `[אורקל אופליין]\nהאורקל רשם את התחזית שלך עבור "${selectedMovie}". $${openingWeekend} מיליון פתיחה וציון ${ratingScore}% נשמעים מעניינים! נקודות בסך ${stakePoints} ננעלו לחיזוי.`;
      setOracleSays(simulatedOracle);

      const newPred: IPrediction = {
        _id: `pred-local-${Date.now()}`,
        movieTitle: selectedMovie,
        predictedOpeningWeekend: openingWeekend,
        predictedRatingScore: ratingScore,
        pointsStaked: stakePoints,
        isResolved: false,
        oracleResponseText: simulatedOracle,
        createdAt: new Date().toISOString()
      };

      setPredictions(prev => [newPred, ...prev]);

      if (user) {
        useAuthStore.setState({ user: { ...user, loyaltyPoints: Math.max(0, (user.loyaltyPoints || 0) - stakePoints) } as any });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderSlider = (label: string, value: number, min: number, max: number, suffix: string, onChange: (val: number) => void) => {
    return (
      <View className="mb-4">
        <View className="flex-row justify-between mb-1.5 px-1">
          <Text className="text-white/40 text-xs font-semibold">{value}{suffix}</Text>
          <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-sm font-semibold">{label}</Text>
        </View>
        <View className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex-row justify-end relative">
          <Pressable 
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            onPressIn={(e) => {
              const rectWidth = width - 72; // Horizontal margins
              const touchX = e.nativeEvent.locationX;
              const percent = touchX / rectWidth;
              const calculatedValue = Math.min(Math.max(Math.round(min + percent * (max - min)), min), max);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(calculatedValue);
            }}
          />
          <View style={{ width: `${((value - min) / (max - min)) * 100}%` }} className="h-full bg-primary" />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }} className="flex-1 px-6">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => router.back()} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-display">CinePredict Box-Office Oracle</Text>
          <Pressable onPress={fetchPredictions} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
            <RefreshCw size={20} color="white" />
          </Pressable>
        </View>

        {isLocalFallback && (
          <View className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex-row items-center gap-3 mb-6">
            <AlertCircle size={18} color={Colors.warning} />
            <Text style={{ textAlign: 'right', flex: 1 }} className="text-amber-500 text-xs font-semibold">אורקל התחזיות פועל במצב אופליין סימולטיבי</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 gap-6">
          {/* Prediction input form */}
          <Animated.View entering={FadeInDown.duration(600).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-5 gap-4">
            <View className="flex-row-reverse items-center justify-between mb-2">
              <Text className="text-white text-base font-bold">הזן תחזית חדשה</Text>
              <View className="flex-row items-center gap-1.5 bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
                <Award size={14} color={Colors.primary} />
                <Text className="text-primary text-xs font-bold">{user?.loyaltyPoints || 0} נק׳ ברשותך</Text>
              </View>
            </View>

            <View className="mb-2">
              <Text style={{ textAlign: 'right' }} className="text-white/40 text-xs mb-1.5">הסרט הנבחר</Text>
              <TextInput
                value={selectedMovie}
                onChangeText={setSelectedMovie}
                placeholder="שם הסרט לחיזוי"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{ textAlign: 'right', fontFamily: 'Rubik-Regular' }}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base"
              />
            </View>

            {renderSlider('סופשבוע פתיחה (ארה"ב)', openingWeekend, 5, 250, ' מיליון $', setOpeningWeekend)}
            {renderSlider('ציון רייטינג חזוי (RT)', ratingScore, 10, 100, '%', setRatingScore)}
            {renderSlider('נקודות הימור (Points staked)', stakePoints, 0, 200, ' נק׳', setStakePoints)}

            <Pressable onPress={handleSubmit} disabled={submitLoading || !selectedMovie} className="rounded-2xl overflow-hidden mt-3">
              <LinearGradient colors={[Colors.primary, '#9B1B30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-4 flex-row justify-center items-center gap-2">
                <Sparkles size={18} color="white" />
                <Text className="text-white text-base font-bold">
                  {submitLoading ? 'שולח תחזית לאורקל...' : 'שלח תחזית לאורקל'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Oracle response banner */}
          {!!oracleSays && (
            <Animated.View entering={FadeInDown.duration(600).springify()} className="bg-primary/5 border border-primary/20 p-5 rounded-3xl">
              <View className="flex-row-reverse items-center justify-between mb-2 pb-2 border-b border-white/5">
                <Text className="text-primary text-sm font-bold">תשובת האורקל</Text>
                <Sparkles size={16} color={Colors.primary} />
              </View>
              <Text style={{ textAlign: 'right', lineHeight: 22 }} className="text-white/80 text-sm font-medium">{oracleSays}</Text>
            </Animated.View>
          )}

          {/* History list */}
          <Animated.View entering={FadeInDown.duration(600).delay(150).springify()} className="rounded-3xl border border-white/10 bg-surfaceLight p-5 mb-8">
            <View className="flex-row-reverse items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <BarChart2 size={16} color={Colors.primary} />
              <Text className="text-white text-sm font-bold">היסטוריית תחזיות</Text>
            </View>

            {loading ? (
              <ActivityIndicator color={Colors.primary} className="py-6" />
            ) : predictions.length === 0 ? (
              <Text style={{ textAlign: 'center' }} className="text-white/40 text-xs py-6">טרם הגשת תחזיות</Text>
            ) : (
              <View className="gap-4">
                {predictions.map(pred => (
                  <View key={pred._id} className="border border-white/5 bg-black/20 p-4 rounded-2xl gap-3">
                    <View className="flex-row-reverse justify-between items-center">
                      <Text className="text-white font-bold text-sm flex-1 text-right">{pred.movieTitle}</Text>
                      <View className={`px-2 py-0.5 rounded-md ${pred.isResolved ? 'bg-secondary/20 border border-secondary/30' : 'bg-white/5 border border-white/10'}`}>
                        <Text className={pred.isResolved ? 'text-secondary text-[10px]' : 'text-white/40 text-[10px]'}>
                          {pred.isResolved ? `נפתר (+${pred.pointsEarned})` : 'פעיל'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row-reverse justify-around bg-surfaceLight/50 py-2 rounded-xl">
                      <View className="items-center">
                        <Text className="text-white/40 text-[9px] mb-0.5">סופשבוע</Text>
                        <Text className="text-white text-xs font-bold">${pred.predictedOpeningWeekend}M</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-white/40 text-[9px] mb-0.5">ציון RT</Text>
                        <Text className="text-white text-xs font-bold">{pred.predictedRatingScore}%</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-white/40 text-[9px] mb-0.5">הימור</Text>
                        <Text className="text-white text-xs font-bold">{pred.pointsStaked} נק׳</Text>
                      </View>
                    </View>

                    {pred.oracleResponseText && (
                      <Text style={{ textAlign: 'right' }} className="text-white/40 text-xs italic mt-1">{pred.oracleResponseText}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>

      </View>
    </View>
  );
}
