import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { AIService, type VoiceCommand } from '@/services/AIService';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { getGenreName } from '@/lib/tmdb';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface UseAIConciergeOptions {
  visible: boolean;
  onNavigate?: (screen: string) => void;
}

export const useAIConcierge = ({ visible, onNavigate }: UseAIConciergeOptions) => {
  const watchlistMovies = useWatchlistStore(state => state.movies);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: '👋 שלום! אני סייען ה-AI של סינבוק. אני מכיר את רשימת הצפייה שלך ויכול להמליץ על סרטים שיתאימו בדיוק לטעם שלך. איך אפשר לעזור?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
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

  // Voice command suggestion chips
  const voiceCommandHints = useMemo(() => [
    { text: '🔍 "חפש סרט אקשן"', emoji: '🔍' },
    { text: '📍 "לך לפרופיל"', emoji: '📍' },
    { text: '🎭 "אני במצב רוח לקומדיה"', emoji: '🎭' },
    { text: '📊 "נתח את הרשימה שלי"', emoji: '📊' },
  ], []);

  useEffect(() => {
    pulseValue.value = withRepeat(withSequence(withTiming(1, { duration: 1200 }), withTiming(0.6, { duration: 1200 })), -1, true);
  }, [pulseValue]);

  const { isRecording, startRecording, stopRecording } = useVoiceRecording();

  useEffect(() => {
    if (!visible) {
      AIService.stopSpeaking();
      if (isRecording) stopRecording();
    }
  }, [visible, isRecording, stopRecording]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
    transform: [{ scale: pulseValue.value }],
  }));

  /**
   * Executes a detected voice command by dispatching the appropriate action
   */
  const executeVoiceCommand = useCallback(async (command: VoiceCommand) => {
    setIsExecutingCommand(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Show the command confirmation message in chat
    const confirmMsg: Message = {
      id: Date.now().toString(),
      role: 'model',
      content: `⚡ ${command.displayText}`,
    };
    setMessages(prev => [...prev, confirmMsg]);

    // Brief delay for the user to see the confirmation
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      switch (command.type) {
        case 'search': {
          // Navigate to search with the query/genre context
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (onNavigate) {
            onNavigate(`search`);
          }
          break;
        }

        case 'navigate': {
          const screen = command.params?.screen || 'home';
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (onNavigate) {
            onNavigate(screen);
          }
          break;
        }

        case 'watchlist_analyze': {
          // Execute watchlist analysis in-chat
          const analysis = await AIService.analyzeWatchlist(
            watchlistMovies.map(m => ({
              title: m.title,
              vote_average: m.vote_average,
              genre_ids: m.genre_ids,
            }))
          );
          const analysisMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: `📊 **ניתוח רשימת הצפייה שלך:**\n\n` +
              `🎬 סה"כ סרטים: ${analysis.stats.totalMovies}\n` +
              `⭐ ציון ממוצע: ${analysis.stats.avgRating.toFixed(1)}\n` +
              `🏆 ז'אנר מוביל: ${analysis.stats.topGenre}\n` +
              `❤️ ז'אנרים אהובים: ${analysis.favoriteGenres.join(', ')}\n\n` +
              `💡 ${analysis.recommendation}`,
          };
          setMessages(prev => [...prev, analysisMsg]);
          if (isTTSEnabled) AIService.speak(analysisMsg.content);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }

        case 'mood': {
          // Get mood-based recommendation and display in chat
          const moodResult = await AIService.getMoodRecommendations(command.params?.mood || '');
          const moodMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: `🎭 **מצב רוח: ${moodResult.mood}**\n\n${moodResult.description}\n\n🎬 בוא נמצא סרטים שמתאימים!`,
          };
          setMessages(prev => [...prev, moodMsg]);
          if (isTTSEnabled) AIService.speak(moodMsg.content);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Navigate to search with genre filter after showing the result
          await new Promise(resolve => setTimeout(resolve, 1500));
          if (onNavigate) {
            onNavigate('search');
          }
          break;
        }

        case 'info': {
          // Use the concierge to answer the info question
          const infoResponse = await AIService.chatWithConcierge(
            [{ role: 'user', content: 'מה מוקרן עכשיו בקולנוע? מה הסרטים הפופולריים?' }],
            watchlistContext
          );
          const infoMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: infoResponse,
          };
          setMessages(prev => [...prev, infoMsg]);
          if (isTTSEnabled) AIService.speak(infoResponse);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        }
      }
    } catch (error) {
      console.error('Voice command execution error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'model',
        content: '😅 סליחה, נתקלתי בבעיה בביצוע הפקודה. נסה שוב!'
      }]);
    } finally {
      setIsExecutingCommand(false);
    }
  }, [watchlistMovies, watchlistContext, isTTSEnabled, onNavigate]);

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
          // Step 1: Transcribe voice to text
          const transcription = await AIService.transcribeVoice(base64);
          if (transcription?.trim()) {
            // Step 2: Detect if it's a voice command
            const command = await AIService.detectVoiceCommand(transcription);

            if (command.type !== 'chat') {
              // It's a command — show the user's spoken text and execute
              const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: `🎙️ ${transcription}`,
              };
              setMessages(prev => [...prev, userMsg]);
              setIsLoading(false);

              // Execute the detected command
              await executeVoiceCommand(command);
            } else {
              // Regular chat — set the input and auto-send
              setInput(transcription);
              setIsLoading(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Auto-send the transcribed text as a chat message
              setTimeout(() => {
                handleSend(transcription);
              }, 300);
            }
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Voice transcription error:', error);
          setIsLoading(false);
        }
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsListening(true);
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording, executeVoiceCommand, handleSend]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isLoading]);

  return {
    messages, input, setInput, isLoading, isTTSEnabled, isListening,
    isExecutingCommand, scrollViewRef, watchlistMovies, watchlistContext,
    suggestions, voiceCommandHints, animatedPulseStyle,
    handleSend, toggleTTS, handleVoicePress,
  };
};
