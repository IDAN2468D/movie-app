import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { AIService } from '@/services/AIService';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { getGenreName } from '@/lib/tmdb';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export const useAIConcierge = (visible: boolean) => {
  const watchlistMovies = useWatchlistStore(state => state.movies);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: '👋 שלום! אני סייען ה-AI של סינבוק. אני מכיר את רשימת הצפייה שלך ויכול להמליץ על סרטים שיתאימו בדיוק לטעם שלך. איך אפשר לעזור?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseValue = useSharedValue(0.6);

  const watchlistContext = useMemo(() => {
    if (watchlistMovies.length === 0) return undefined;
    const allGenreIds = watchlistMovies.flatMap(m => m.genre_ids);
    const genreCounts: Record<number, number> = {};
    for (const gid of allGenreIds) genreCounts[gid] = (genreCounts[gid] || 0) + 1;
    const topGenres = Object.entries(genreCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([gid]) => getGenreName(Number(gid)));
    const avgRating = watchlistMovies.reduce((sum, m) => sum + m.vote_average, 0) / watchlistMovies.length;
    return { titles: watchlistMovies.map(m => m.title), genres: topGenres, avgRating };
  }, [watchlistMovies]);

  const suggestions = useMemo(() => {
    const base = [{ text: '🎬 סרט מתח', emoji: '🎬' }, { text: '🍿 מה חדש?', emoji: '🍿' }];
    if (watchlistMovies.length > 0) {
      base.push({ text: '📊 נתח את הרשימה שלי', emoji: '📊' }, { text: '🎯 מה מתאים לי?', emoji: '🎯' });
    } else {
      base.push({ text: '🎥 לכל המשפחה', emoji: '🎥' }, { text: '🎭 דרמות מומלצות', emoji: '🎭' });
    }
    return base;
  }, [watchlistMovies.length]);

  useEffect(() => {
    pulseValue.value = withRepeat(withSequence(withTiming(1, { duration: 1200 }), withTiming(0.6, { duration: 1200 })), -1, true);
  }, [pulseValue]);

  const { isRecording, startRecording, stopRecording } = useVoiceRecording();

  useEffect(() => {
    if (!visible) {
      AIService.stopSpeaking();
      if (isRecording) stopRecording();
    }
  }, [visible, isRecording]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
    transform: [{ scale: pulseValue.value }],
  }));

  const handleSend = useCallback(async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customInput) setInput('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const lowerText = textToSend.toLowerCase();
      let response: string;
      if (lowerText.includes('נתח') && lowerText.includes('רשימ')) {
        const analysis = await AIService.analyzeWatchlist(watchlistMovies.map(m => ({ title: m.title, vote_average: m.vote_average, genre_ids: m.genre_ids })));
        response = `📊 **ניתוח רשימת הצפייה שלך:**\n\n🎬 סה"כ סרטים: ${analysis.stats.totalMovies}\n⭐ ציון ממוצע: ${analysis.stats.avgRating.toFixed(1)}\n🏆 ז'אנר מוביל: ${analysis.stats.topGenre}\n❤️ ז'אנרים אהובים: ${analysis.favoriteGenres.join(', ')}\n\n💡 ${analysis.recommendation}`;
      } else {
        response = await AIService.chatWithConcierge(messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })), watchlistContext);
      }
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response };
      setMessages(prev => [...prev, aiMsg]);
      if (isTTSEnabled) AIService.speak(response);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: '😅 סליחה, נתקלתי בבעיה. נסה שוב בבקשה!' }]);
    } finally { setIsLoading(false); }
  }, [input, isLoading, messages, watchlistMovies, watchlistContext, isTTSEnabled]);

  const toggleTTS = useCallback(() => {
    Haptics.selectionAsync();
    const nextState = !isTTSEnabled;
    setIsTTSEnabled(nextState);
    if (!nextState) AIService.stopSpeaking();
  }, [isTTSEnabled]);

  const handleVoicePress = useCallback(async () => {
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsListening(false);
      const base64 = await stopRecording();
      if (base64) {
        setIsLoading(true);
        try {
          const transcription = await AIService.transcribeVoice(base64);
          if (transcription?.trim()) { setInput(transcription); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
        } catch (error) { console.error('Voice transcription error:', error); }
        finally { setIsLoading(false); }
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsListening(true);
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isLoading]);

  return {
    messages, input, setInput, isLoading, isTTSEnabled, isListening,
    scrollViewRef, watchlistMovies, watchlistContext, suggestions,
    animatedPulseStyle, handleSend, toggleTTS, handleVoicePress,
  };
};
