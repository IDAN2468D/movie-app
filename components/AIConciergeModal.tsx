import React, { useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInLeft, FadeInDown, FadeInUp, withRepeat, withSequence, withTiming, withDelay, useAnimatedStyle, useSharedValue, interpolate } from 'react-native-reanimated';
import { Send, X, User, Sparkles, Zap, Volume2, VolumeX, Mic, BookmarkCheck, Command } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import { useAIConcierge } from '@/hooks/useAIConcierge';

interface AIConciergeModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    className="mb-6 flex-row items-end justify-end gap-2"
  >
    <View className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-none border border-white/10 flex-row items-center">
      <TypingDot index={0} />
      <TypingDot index={1} />
      <TypingDot index={2} />
      <Text className="text-[12px] text-white/40 ms-3 font-body">ה-AI חושב...</Text>
    </View>
    <View className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center">
      <Zap size={14} color={Colors.primary} />
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

// ─── Command Execution Banner ─────────────────────────────────────────────────

const CommandBanner = () => (
  <Animated.View
    entering={FadeInUp.springify().damping(15)}
    className="mx-4 mb-3 p-3 rounded-2xl border flex-row items-center justify-center gap-2"
    style={{
      backgroundColor: 'rgba(255, 20, 100, 0.08)',
      borderColor: 'rgba(255, 20, 100, 0.2)',
    }}
  >
    <Command size={14} color={Colors.primary} />
    <Text className="text-[12px] font-bold font-body" style={{ color: Colors.primary }}>
      ⚡ מבצע פקודה קולית...
    </Text>
  </Animated.View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIConciergeModal({ visible, onClose, onNavigate: parentNavigate }: AIConciergeModalProps) {
  const insets = useSafeAreaInsets();

  // Navigation handler — closes the modal, then delegates to the parent's router
  const handleNavigate = useCallback((screen: string) => {
    onClose();
    if (parentNavigate) {
      setTimeout(() => parentNavigate(screen), 400);
    }
  }, [onClose, parentNavigate]);

  const {
    messages, input, setInput, isLoading, isTTSEnabled, isListening,
    isExecutingCommand, scrollViewRef, watchlistMovies, watchlistContext,
    suggestions, voiceCommandHints, animatedPulseStyle,
    handleSend, toggleTTS, handleVoicePress,
  } = useAIConcierge({ visible, onNavigate: handleNavigate });

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View className="flex-1">
        {/* Cinematic Backdrop */}
        <LinearGradient
          colors={['#000', '#0a0a0a', '#121212']}
          className="absolute inset-0"
        />
        
        <View className="flex-1 bg-background">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            className="flex-1"
          >
            {/* Header */}
            <View className="pt-14 pb-4 px-6 border-b border-white/5 bg-black/40">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="me-4">
                    <LinearGradient
                      colors={[Colors.primary, '#9333ea']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="p-2.5 rounded-2xl border border-white/20"
                    >
                      <Sparkles size={22} color="white" />
                    </LinearGradient>
                    <Animated.View 
                      style={[{ position: 'absolute', bottom: -2, end: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#000' }, animatedPulseStyle]}
                    />
                  </View>
                  <View>
                    <Text className="text-h2 text-white font-display text-start">סייען AI אישי</Text>
                    <View className="flex-row items-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-green-500 me-1.5" />
                      <Text className="text-caption text-white/50 font-body text-start">
                        {isExecutingCommand ? '⚡ מבצע פקודה...' : 'פעיל במערכת • תומך פקודות קוליות'}
                      </Text>
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

              {/* Watchlist Context Indicator */}
              {watchlistMovies.length > 0 && (
                <Animated.View entering={FadeInDown.delay(300).duration(500)} className="flex-row items-center mt-3 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                  <BookmarkCheck size={14} color={Colors.primary} />
                  <Text className="text-[11px] text-primary/80 ms-2 font-body">
                    מכיר {watchlistMovies.length} סרטים מהרשימה שלך • ז'אנר מוביל: {watchlistContext?.genres[0] || 'כללי'}
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Command Execution Banner */}
            {isExecutingCommand && <CommandBanner />}

            {/* Chat Messages */}
            <ScrollView 
              ref={scrollViewRef}
              className="flex-1 px-4 pt-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isCommandMsg = msg.content.startsWith('⚡');
                return (
                  <Animated.View 
                    key={msg.id}
                    entering={isUser ? FadeInRight.springify() : FadeInLeft.springify()}
                    className={`mb-5 flex-row items-end gap-2 ${isUser ? 'justify-start' : 'justify-end'}`}
                  >
                    {isUser ? (
                      <>
                        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center border border-white/20">
                          <User size={14} color="white" />
                        </View>
                        <View 
                          style={{
                            backgroundColor: Colors.primary,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 4,
                            padding: 14,
                            maxWidth: '80%',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                            shadowColor: Colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 4
                          }}
                        >
                          <Text 
                            className="text-[15px] font-body leading-relaxed text-white text-start"
                            style={{
                              textAlign: 'right',
                              writingDirection: 'rtl',
                            }}
                          >
                            {msg.content}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View 
                          style={{
                            backgroundColor: isCommandMsg ? 'rgba(255, 20, 100, 0.1)' : 'rgba(255,255,255,0.06)',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 20,
                            padding: 14,
                            maxWidth: '80%',
                            borderWidth: 1,
                            borderColor: isCommandMsg ? 'rgba(255, 20, 100, 0.25)' : 'rgba(255,255,255,0.1)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 4
                          }}
                        >
                          <Text 
                            className="text-[15px] font-body leading-relaxed text-white/90 text-left"
                            style={{
                              textAlign: 'left',
                              writingDirection: 'ltr',
                            }}
                          >
                            {msg.content}
                          </Text>
                        </View>
                        <View className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                          {isCommandMsg ? (
                            <Command size={14} color={Colors.primary} />
                          ) : (
                            <Zap size={14} color={Colors.primary} />
                          )}
                        </View>
                      </>
                    )}
                  </Animated.View>
                );
              })}
              
              {isLoading && (
                <TypingIndicator />
              )}

            </ScrollView>

            {/* Bottom Controls */}
            <View 
              className="px-4 pt-2 bg-black/40 border-t border-white/5"
              style={{ paddingBottom: Math.max(insets.bottom, 24) + 12 }}
            >
              {/* Voice Command Hints (shown when listening) */}
              {isListening && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    className="mb-3"
                  >
                    {voiceCommandHints.map((hint, i) => (
                      <View
                        key={i}
                        className="border px-3 py-2 rounded-full me-2"
                        style={{
                          backgroundColor: 'rgba(255, 20, 100, 0.06)',
                          borderColor: 'rgba(255, 20, 100, 0.15)',
                        }}
                      >
                        <Text className="text-[11px] font-body" style={{ color: 'rgba(255, 20, 100, 0.7)' }}>
                          {hint.text}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Quick Suggestions (shown when not listening) */}
              {!isLoading && !isListening && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  className="mb-4"
                >
                  {suggestions.map((suggestion, i) => (
                    <Pressable
                      key={i}
                      onPress={() => handleSend(suggestion.text)}
                      className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-full me-2.5 flex-row items-center"
                    >
                      <Text className="text-[13px] text-white/80 font-body">{suggestion.text}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Input Area */}
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-[28px] p-1.5 px-4">
                <Pressable 
                  onPress={handleVoicePress}
                  className={`me-2 w-10 h-10 items-center justify-center rounded-full ${isListening ? 'bg-primary/20' : ''}`}
                >
                  {isListening ? (
                    <VoiceWave />
                  ) : (
                    <Mic size={20} color={input.trim() ? "white" : "rgba(255,255,255,0.4)"} />
                  )}
                </Pressable>

                <TextInput
                  className="flex-1 h-11 text-white font-body text-start text-[15px]"
                  placeholder={isListening ? "מקשיב לפקודה שלך..." : "הקלד או דבר פקודה..."}
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
        </View>
      </View>
    </Modal>
  );
}
