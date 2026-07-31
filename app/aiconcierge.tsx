import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Mic, Send, Volume2, VolumeX, X, RefreshCw, Sparkles, MessageCircle } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming, 
  interpolateColor,
  runOnJS
} from 'react-native-reanimated';
import { Audio } from '@/utils/safeExpoAv';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';
import * as FileSystem from 'expo-file-system/legacy';
import { getRouteForScreen } from '@/utils/navigationUtils';
import { AIService } from '@/services/AIService';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const AURA_COLORS = {
  neutral: { primary: '#00F0FF', secondary: '#7000FF', bg: 'rgba(0, 240, 255, 0.05)' },
  romantic: { primary: '#FF1493', secondary: '#FF69B4', bg: 'rgba(255, 20, 147, 0.05)' },
  suspenseful: { primary: '#FF3B30', secondary: '#8B0000', bg: 'rgba(255, 59, 48, 0.05)' },
  energetic: { primary: '#E5FF00', secondary: '#FF8A00', bg: 'rgba(229, 255, 0, 0.05)' },
  chill: { primary: '#007AFF', secondary: '#00F0FF', bg: 'rgba(0, 122, 255, 0.05)' }
};

export default function AICineConciergeScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const scrollViewRef = useRef<ScrollView>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'שלום! אני הקונסיירז׳ הקולנועי שלך. במה אוכל לעזור היום? תוכל לשאול אותי על סרטים מומלצים, ז׳אנרים, או פשוט לספר לי מה בא לך לראות.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<'neutral' | 'romantic' | 'suspenseful' | 'energetic' | 'chill'>('neutral');

  // Animation values for the neon orb
  const orbScale = useSharedValue(1);
  const orbPulse = useSharedValue(0);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    // Start idle pulsing animation
    orbPulse.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );

    // Initialize session on mount
    startNewSession();

    return () => {
      // Clean up Speech and Audio
      Speech.stop();
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startNewSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data?._id) {
          setSessionId(json.data._id);
        }
      }
    } catch (err) {
      console.warn('Could not initialize server chat session, running in offline/local mode:', err);
    }
  };

  // Pulse styles
  const animatedOrbStyle = useAnimatedStyle(() => {
    const scale = isRecording ? orbScale.value : 1 + (orbPulse.value * 0.15);
    return {
      transform: [{ scale }],
      shadowRadius: 20 + (orbPulse.value * 15),
      opacity: 0.85 + (orbPulse.value * 0.15),
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(AURA_COLORS[sentiment].bg, { duration: 800 })
    };
  });

  // Handle Recording Voice
  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);

      // Start mapping voice levels to orb scale
      newRecording.setProgressUpdateInterval(100);
      newRecording.setOnRecordingStatusUpdate((status: any) => {
        if (status.metering !== undefined) {
          // Metering is usually from -160 to 0 db
          const amplitude = Math.max(0, (status.metering + 160) / 160);
          orbScale.value = withSpring(1 + amplitude * 1.2, { damping: 10, stiffness: 120 });
        }
      });

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Reset orb scale smoothly
      orbScale.value = withSpring(1);

      setLoading(true);

      let transcribedText = '';
      if (uri) {
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          if (base64) {
            transcribedText = await AIService.transcribeVoice(base64);
          }
        } catch (fsErr) {
          console.warn('FileSystem read error in aiconcierge:', fsErr);
        }
      }

      if (!transcribedText) {
        transcribedText = await AIService.transcribeVoice('MOCK_BASE64_VOICE_DATA');
      }

      await sendMessage(transcribedText);

    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (!isVoiceOutputEnabled) return;
    Speech.stop();
    Speech.speak(text, {
      language: 'he-IL',
      rate: 0.95,
      pitch: 1.0,
    });
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message to state
    const userMsg: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // Step 0: Check if message is a navigation or action command
    try {
      const command = await AIService.detectVoiceCommand(trimmed);
      if (command && command.type !== 'chat') {
        const confirmMsg: Message = { role: 'model', content: `⚡ ${command.displayText}`, timestamp: new Date() };
        setMessages(prev => [...prev, confirmMsg]);
        if (isVoiceOutputEnabled) speakText(command.displayText);

        setTimeout(() => {
          const targetScreen = command.params?.screen || 'home';
          const route = getRouteForScreen(targetScreen);
          router.push(route as any);
        }, 600);
        setLoading(false);
        return;
      }
    } catch (cmdErr) {
      console.warn('Command detection error:', cmdErr);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId || undefined
        })
      });

      if (!response.ok) throw new Error('Network response not ok');

      const json = await response.json();
      if (json.success && json.data) {
        const reply = json.data.response;
        const newSentiment = json.data.sentiment || 'neutral';
        
        setSentiment(newSentiment);
        setMessages(prev => [...prev, {
          role: 'model',
          content: reply,
          timestamp: new Date()
        }]);

        if (isVoiceOutputEnabled) {
          speakText(reply);
        }
      } else {
        throw new Error('Unsuccessful API message response');
      }

    } catch (err) {
      console.warn('API error in chat, falling back to local matches:', err);
      // Local offline fallback recommendation logic
      let reply = 'אני מצטער, יש לי קושי קטן בחיבור כרגע. אשמח להמליץ לך מתוך הקטלוג השמור שלי.';
      let newSentiment: typeof sentiment = 'neutral';

      const lower = trimmed.toLowerCase();
      if (lower.includes('מתח') || lower.includes('אימה') || lower.includes('מפחיד')) {
        reply = 'ממליץ בחום על "לחישות באפילה" (אימה/מתח) – סרט מצוין שמציג כרגע באולם 4!';
        newSentiment = 'suspenseful';
      } else if (lower.includes('אהבה') || lower.includes('רומנט') || lower.includes('דרמה')) {
        reply = 'אתה חייב לראות את "שקיעות סגולות" – דרמה רומנטית מרגשת ומקסימה.';
        newSentiment = 'romantic';
      } else if (lower.includes('קומד') || lower.includes('מצחיק') || lower.includes('ילדים')) {
        reply = 'לכיף משפחתי מושלם, ממליץ על "שובבים בחלל" – קומדיית אנימציה קורעת מצחוק!';
        newSentiment = 'energetic';
      }

      setSentiment(newSentiment);
      setMessages(prev => [...prev, {
        role: 'model',
        content: reply,
        timestamp: new Date()
      }]);

      if (isVoiceOutputEnabled) {
        speakText(reply);
      }
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: Colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.container, { paddingTop: insets.top }, animatedBackgroundStyle]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={20} color="#FFF" />
          </Pressable>
          
          <View style={styles.headerTitleContainer}>
            <Sparkles size={16} color={AURA_COLORS[sentiment].primary} />
            <Text style={styles.headerTitle}>קונסיירז׳ AI קולנועי</Text>
          </View>

          <Pressable 
            style={[styles.voiceToggle, isVoiceOutputEnabled && styles.voiceToggleActive]} 
            onPress={() => {
              setIsVoiceOutputEnabled(!isVoiceOutputEnabled);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isVoiceOutputEnabled) {
                Speech.stop();
              }
            }}
          >
            {isVoiceOutputEnabled ? (
              <Volume2 size={20} color="#FFF" />
            ) : (
              <VolumeX size={20} color="rgba(255,255,255,0.4)" />
            )}
          </Pressable>
        </View>

        {/* Pulsing Visual Orb */}
        <View style={styles.orbContainer}>
          <Animated.View style={[
            styles.neonOrb, 
            { 
              backgroundColor: AURA_COLORS[sentiment].primary,
              shadowColor: AURA_COLORS[sentiment].primary,
            }, 
            animatedOrbStyle
          ]}>
            <Animated.View style={[
              styles.neonOrbInner,
              { backgroundColor: AURA_COLORS[sentiment].secondary }
            ]} />
          </Animated.View>
          <Text style={[styles.orbStatusText, { color: AURA_COLORS[sentiment].primary }]}>
            {isRecording ? 'מקשיב לך...' : loading ? 'חושב על המלצה...' : 'במה אפשר לעזור לך?'}
          </Text>
        </View>

        {/* Chat Message Thread */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <Animated.View 
                key={index}
                style={[
                  styles.messageBubbleContainer,
                  isUser ? styles.userBubbleAlign : styles.modelBubbleAlign
                ]}
              >
                <BlurView 
                  intensity={35}
                  tint="dark"
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.modelBubble,
                    !isUser && { borderColor: `${AURA_COLORS[sentiment].primary}30`, borderWidth: 1 }
                  ]}
                >
                  <Text style={isUser ? styles.userBubbleText : styles.modelBubbleText}>
                    {msg.content}
                  </Text>
                </BlurView>
              </Animated.View>
            );
          })}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={AURA_COLORS[sentiment].primary} />
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 36, marginBottom: 8, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            <Pressable onPress={() => sendMessage('הצג לי סרטי VIP להערב 🍿')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: `${AURA_COLORS[sentiment].primary}40` }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>🍿 הקרנות VIP להערב</Text>
            </Pressable>
            <Pressable onPress={() => sendMessage('מה המושבים הכי טובים באולם 1? 🎟️')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: `${AURA_COLORS[sentiment].primary}40` }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>🎟️ מושבים מומלצים</Text>
            </Pressable>
            <Pressable onPress={() => sendMessage('המלץ לי על סרט מתח מרתק ⚡')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: `${AURA_COLORS[sentiment].primary}40` }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>⚡ סרט מתח חם</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Omni-Box Capsule Input Controls Bar */}
        <BlurView intensity={60} tint="dark" style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12), borderColor: `${AURA_COLORS[sentiment].primary}50` }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Omni-Box: שאל על סרטים, מושבים או שעות..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            textAlign="left"
          />

          {inputText.trim().length > 0 ? (
            <Pressable 
              style={[styles.sendButton, { backgroundColor: AURA_COLORS[sentiment].primary }]} 
              onPress={() => sendMessage(inputText)}
            >
              <Send size={18} color="#000" style={{ transform: [{ scaleX: -1 }] }} />
            </Pressable>
          ) : (
            <Pressable 
              style={[
                styles.micButton, 
                isRecording && { backgroundColor: '#FF3B30', transform: [{ scale: 1.1 }] }
              ]} 
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Mic size={20} color={isRecording ? '#FFF' : '#000'} />
            </Pressable>
          )}
        </BlurView>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Assistant-Bold',
    fontSize: 18,
    color: '#FFF',
  },
  voiceToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  voiceToggleActive: {
    backgroundColor: '#00F0FF30',
    borderColor: '#00F0FF50',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  neonOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 10,
  },
  neonOrbInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.8,
  },
  orbStatusText: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: 'Assistant-Medium',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  userBubbleAlign: {
    justifyContent: 'flex-end',
  },
  modelBubbleAlign: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modelBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopRightRadius: 4,
  },
  userBubbleText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Assistant-Regular',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  modelBubbleText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontFamily: 'Assistant-Regular',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 23,
    paddingHorizontal: 18,
    color: '#FFF',
    fontFamily: 'Assistant-Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
