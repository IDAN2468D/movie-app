import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInLeft, withRepeat, withSequence, withTiming, withDelay, useAnimatedStyle, useSharedValue, interpolate } from 'react-native-reanimated';
import { Send, X, User, Sparkles, Zap, Volume2, VolumeX, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIService } from '@/services/AIService';
import { Colors } from '@/constants/Theme';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface AIConciergeModalProps {
  visible: boolean;
  onClose: () => void;
}

// Sub-components for animations to follow hook rules
const TypingDot = ({ index }: { index: number }) => {
  const dot = useSharedValue(0);
  
  useEffect(() => {
    dot.value = withRepeat(
      withSequence(
        withDelay(index * 200, withTiming(1, { duration: 400 })),
        withTiming(0, { duration: 400 })
      ),
      -1,
      true
    );
  }, [index, dot]);

  const style = useAnimatedStyle(() => ({
    opacity: dot.value,
    transform: [{ translateY: -dot.value * 3 }]
  }));

  return (
    <Animated.View 
      style={[{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginHorizontal: 2
      }, style]}
    />
  );
};

const TypingIndicator = () => (
  <Animated.View 
    entering={FadeInLeft}
    className="flex-row items-center ml-10 mb-6"
  >
    <View className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/10 flex-row items-center">
      <TypingDot index={0} />
      <TypingDot index={1} />
      <TypingDot index={2} />
      <Text className="text-[12px] text-white/40 ml-3 font-body">ה-AI חושב...</Text>
    </View>
  </Animated.View>
);


const VoiceWave = () => {
  return (
    <View className="flex-row items-center justify-center gap-1 h-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <WaveBar key={i} index={i} />
      ))}
    </View>
  );
};

const WaveBar = ({ index }: { index: number }) => {
  const height = useSharedValue(5);
  
  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(15 + Math.random() * 15, { duration: 300 + Math.random() * 200 }),
        withTiming(5, { duration: 300 + Math.random() * 200 })
      ),
      -1,
      true
    );
  }, [height]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: interpolate(height.value, [5, 30], [0.3, 1])
  }));

  return (
    <Animated.View 
      style={[{
        width: 3,
        borderRadius: 2,
        backgroundColor: Colors.primary,
      }, style]}
    />
  );
};

export default function AIConciergeModal({ visible, onClose }: AIConciergeModalProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: 'שלום! אני סייען ה-AI של סינבוק. איך אני יכול לעזור לך למצוא את הסרט המושלם להיום?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Shared values for animations
  const pulseValue = useSharedValue(0.6);


  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.6, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [pulseValue]);

  useEffect(() => {
    if (!visible) {
      AIService.stopSpeaking();
    }
  }, [visible]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
    transform: [{ scale: pulseValue.value }],
  }));

  const suggestions = [
    { text: '🎬 סרט מתח', emoji: '🎬' },
    { text: '🍿 מה חדש?', emoji: '🍿' },
    { text: '🎥 לכל המשפחה', emoji: '🎥' },
    { text: '🎭 דרמות', emoji: '🎭' }
  ];

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customInput) setInput('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await AIService.chatWithConcierge(
        messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }))
      );
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response };
      setMessages(prev => [...prev, aiMsg]);
      
      if (isTTSEnabled) {
        AIService.speak(response);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('AI Chat Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTTS = () => {
    Haptics.selectionAsync();
    const nextState = !isTTSEnabled;
    setIsTTSEnabled(nextState);
    if (!nextState) {
      AIService.stopSpeaking();
    }
  };

  const startListening = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsListening(true);
    
    // Simulate Voice Recognition for 2026 Vision
    setTimeout(() => {
      setIsListening(false);
      const sampleQueries = [
        'אני רוצה לראות סרט אקשן הערב',
        'תזמין לי פופקורן גדול וקולה',
        'איזה סרטים מומלצים לילדים?',
        'מתי ההקרנה הבאה של באטמן?'
      ];
      const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      setInput(randomQuery);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isLoading]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View className="flex-1">
        {/* Cinematic Backdrop */}
        <LinearGradient
          colors={['#000', '#0a0a0a', '#121212']}
          className="absolute inset-0"
        />
        
        <BlurView intensity={40} tint="dark" className="flex-1">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            className="flex-1"
          >
            {/* Header - Premium Glassmorphism */}
            <View className="pt-14 pb-4 px-6 border-b border-white/5 bg-black/40">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="mr-4">
                    <LinearGradient
                      colors={[Colors.primary, '#9333ea']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="p-2.5 rounded-2xl border border-white/20"
                    >
                      <Sparkles size={22} color="white" />
                    </LinearGradient>
                    <Animated.View 
                      style={[{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#000' }, animatedPulseStyle]}
                    />
                  </View>
                  <View>
                    <Text className="text-h2 text-white font-display text-left">סייען AI אישי</Text>
                    <View className="flex-row items-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                      <Text className="text-caption text-white/50 font-body text-left">פעיל במערכת</Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row items-center gap-3">
                  <Pressable 
                    onPress={toggleTTS}
                    className={`w-11 h-11 items-center justify-center rounded-full border ${isTTSEnabled ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'}`}
                  >
                    {isTTSEnabled ? <Volume2 size={20} color={Colors.primary} /> : <VolumeX size={20} color="white" />}
                  </Pressable>

                  <Pressable 
                    onPress={onClose}
                    className="w-11 h-11 items-center justify-center bg-white/5 rounded-full border border-white/10"
                  >
                    <X size={20} color="white" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Chat Messages */}
            <ScrollView 
              ref={scrollViewRef}
              className="flex-1 px-4 pt-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {messages.map((msg, index) => (
                <Animated.View 
                  key={msg.id}
                  entering={msg.role === 'user' ? FadeInRight.springify() : FadeInLeft.springify()}
                  className={`mb-5 flex-row items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'model' && (
                    <View className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center mr-2 mb-1">
                      <Zap size={14} color={Colors.primary} />
                    </View>
                  )}
                  
                  <View 
                    style={{
                      backgroundColor: msg.role === 'user' ? Colors.primary : 'rgba(255,255,255,0.06)',
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      borderBottomLeftRadius: msg.role === 'model' ? 4 : 20,
                      borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
                      padding: 14,
                      maxWidth: '80%',
                      borderWidth: 1,
                      borderColor: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                      shadowColor: msg.role === 'user' ? Colors.primary : '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4
                    }}
                  >
                    <Text 
                      className={`text-[15px] font-body leading-relaxed text-left ${msg.role === 'user' ? 'text-white' : 'text-white/90'}`}
                    >
                      {msg.content}
                    </Text>
                  </View>

                  {msg.role === 'user' && (
                    <View className="w-8 h-8 rounded-full bg-primary items-center justify-center ml-2 mb-1 border border-white/20">
                      <User size={14} color="white" />
                    </View>
                  )}
                </Animated.View>
              ))}
              
              {isLoading && (
                <TypingIndicator />
              )}

            </ScrollView>

            {/* Bottom Controls */}
            <View 
              className="px-4 pt-2 bg-black/40 border-t border-white/5"
              style={{ paddingBottom: Math.max(insets.bottom, 24) + 12 }}
            >
              {/* Quick Suggestions */}
              {!isLoading && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  className="mb-4"
                >
                  {suggestions.map((suggestion, i) => (
                    <Pressable
                      key={i}
                      onPress={() => handleSend(suggestion.text)}
                      className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-full mr-2.5 flex-row items-center"
                    >
                      <Text className="text-[13px] text-white/80 font-body">{suggestion.text}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Input Area */}
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-[28px] p-1.5 px-4">
                <Pressable 
                  onPress={startListening}
                  className={`mr-2 w-10 h-10 items-center justify-center rounded-full ${isListening ? 'bg-primary/20' : ''}`}
                >
                  {isListening ? (
                    <VoiceWave />
                  ) : (
                    <Mic size={20} color={input.trim() ? "white" : "rgba(255,255,255,0.4)"} />
                  )}
                </Pressable>

                <TextInput
                  className="flex-1 h-11 text-white font-body text-left text-[15px]"
                  placeholder={isListening ? "מקשיב לך..." : "איזה סרט כדאי לי לראות?"}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={input}
                  onChangeText={setInput}
                  multiline={false}
                  onSubmitEditing={() => handleSend()}
                />
                
                <Pressable 
                  onPress={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  style={{
                    backgroundColor: input.trim() ? Colors.primary : 'rgba(255,255,255,0.05)',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: input.trim() ? 1 : 0.5
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Send size={18} color="white" />
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </View>
    </Modal>
  );
}

