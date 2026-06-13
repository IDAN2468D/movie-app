import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, AlertTriangle, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { Colors, Typography } from '@/constants/Theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  useDebateMessages,
  useDebateIsLoading,
  useDebateIsThinking,
  useDebateError,
  useDebateActions,
} from '@/store/useDebateStore';

function ThinkingIndicator() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSpring(1.25, { damping: 4, stiffness: 45 }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(1.0, { duration: 700 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className="self-start mb-4 max-w-[80%]"
      style={{ alignSelf: 'flex-start' }}
    >
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          borderBottomLeftRadius: 4,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Animated.View
          style={[animatedStyle, { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary }]}
        />
        <Text
          className="text-white/70 text-[14px]"
          style={{
            fontFamily: 'Assistant-Medium',
            textAlign: 'right',
            writingDirection: 'rtl',
          }}
        >
          המבקר מנסח טיעון נגד...
        </Text>
      </View>
    </Animated.View>
  );
}

export default function DebateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, title = 'הסרט' } = useLocalSearchParams<{ id: string; title: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const messages = useDebateMessages();
  const isLoading = useDebateIsLoading();
  const isThinking = useDebateIsThinking();
  const error = useDebateError();
  const { startSession, sendMessage, clearSession } = useDebateActions();

  const [inputText, setInputText] = useState('');

  const movieId = parseInt(id || '0', 10);

  useEffect(() => {
    if (movieId > 0) {
      startSession(movieId, title);
    }
    return () => {
      clearSession();
    };
  }, [movieId, title]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length, isThinking]);

  const hasText = inputText.trim().length > 0;
  const sendIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scaleX: -1 },
        { scale: withSpring(hasText ? 1.15 : 1, { mass: 0.5, damping: 12 }) },
        { rotate: withSpring(hasText ? '-15deg' : '0deg', { mass: 0.5, damping: 12 }) },
      ],
      opacity: withTiming(hasText ? 1 : 0.4, { duration: 200 }),
    };
  });

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const success = await sendMessage(movieId, title, textToSend);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090B' }}>
      {/* Premium Cinematic Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#180828', '#09090B', '#11051F']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Neon Glow Orb */}
        <View
          style={{
            position: 'absolute',
            top: -120,
            right: -60,
            width: 350,
            height: 350,
            borderRadius: 175,
            backgroundColor: Colors.primary,
            opacity: 0.12,
            filter: 'blur(90px)',
          }}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Liquid Glass Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ zIndex: 10 }}>
          <BlurView
            intensity={65}
            tint="dark"
            style={{
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <View className="px-5 flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 justify-center items-center"
              >
                {I18nManager.isRTL ? (
                  <ChevronRight color="white" size={24} />
                ) : (
                  <ChevronLeft color="white" size={24} />
                )}
              </Pressable>

              {/* Centered Title */}
              <View className="absolute left-0 right-0 items-center justify-center pointer-events-none">
                <Text
                  style={[Typography.h3, { fontFamily: 'Rubik-Bold', color: 'white', marginBottom: 2 }]}
                  numberOfLines={1}
                >
                  עימות קולנועי AI
                </Text>
                <Text
                  style={[Typography.caption, { color: Colors.secondary, fontFamily: 'Rubik-Medium' }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>

              <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/10 border border-primary/20">
                <Sparkles size={18} color={Colors.primary} />
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Debate Warning Banner */}
        <Animated.View entering={FadeIn.delay(300)} style={{ zIndex: 9, marginTop: -1 }}>
          <BlurView
            intensity={35}
            tint="dark"
            className="border-b border-primary/25 p-2.5 flex-row items-center justify-center gap-2 bg-primary/5"
          >
            <AlertTriangle size={14} color={Colors.primary} />
            <Text
              className="text-[12px] font-bold"
              style={{
                color: Colors.primary,
                fontFamily: 'Rubik-Medium',
                textAlign: 'center',
                writingDirection: 'rtl',
              }}
            >
              אזהרה: המבקר הביקורתי אינו מסכים עם איש!
            </Text>
          </BlurView>
        </Animated.View>

        {/* Messages / Chat Area */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-white/60 font-body mt-4 text-[14px]" style={{ writingDirection: 'rtl' }}>
              טוען היסטוריית עימות...
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5 pt-6"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Initial Welcome Message from System */}
            <Animated.View
              layout={LinearTransition.springify()}
              entering={FadeInDown.duration(400)}
              className="self-center mb-6 max-w-[92%]"
            >
              <BlurView
                intensity={25}
                tint="light"
                className="px-5 py-4 rounded-3xl border border-white/10 overflow-hidden bg-white/5"
              >
                <Text
                  className="text-[14px] text-white/80 font-body text-center leading-6"
                  style={{ writingDirection: 'rtl', textAlign: 'center' }}
                >
                  {`ברוכים הבאים לזירת העימות הקולנועי של "${title}"! 🎬\nכאן תוכל להציג את דעתך על הסרט, ובינת העל הביקורתית שלנו תנסה לאתגר אותך בטיעונים נגדיים מעוררי מחשבה. נסה לשכנע אותה!`}
                </Text>
              </BlurView>
            </Animated.View>

            {/* Message List */}
            {messages.map((msg, idx) => {
              const isAI = msg.role === 'model';

              return (
                <Animated.View
                  key={msg._id || idx.toString()}
                  layout={LinearTransition.springify()}
                  entering={FadeInDown.delay(Math.min(idx * 40, 300)).springify()}
                  style={{
                    alignSelf: isAI ? 'flex-start' : 'flex-end',
                    marginBottom: 16,
                    maxWidth: '82%',
                  }}
                >
                  {isAI && (
                    <Text
                      className="text-[12px] font-bold mb-1.5 opacity-90 ms-1"
                      style={{
                        writingDirection: 'rtl',
                        color: Colors.secondary,
                        textAlign: 'right',
                        fontFamily: 'Assistant-Bold',
                      }}
                    >
                      מבקר קולנוע AI 🤖
                    </Text>
                  )}

                  {isAI ? (
                    <View
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: 20,
                        borderBottomLeftRadius: 4,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text
                        className="text-[15px] text-white/95 leading-[23px]"
                        style={{
                          writingDirection: 'rtl',
                          textAlign: 'right',
                          fontFamily: 'Assistant-Medium',
                        }}
                      >
                        {msg.content}
                      </Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={[Colors.primary, '#8B152A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: 4,
                        borderBottomLeftRadius: 20,
                        shadowColor: Colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 5,
                      }}
                    >
                      <Text
                        className="text-[15px] text-white leading-[23px]"
                        style={{
                          writingDirection: 'rtl',
                          textAlign: 'right',
                          fontFamily: 'Assistant-Medium',
                        }}
                      >
                        {msg.content}
                      </Text>
                    </LinearGradient>
                  )}
                </Animated.View>
              );
            })}

            {/* Thinking / Typing Indicator */}
            {isThinking && <ThinkingIndicator />}

            {/* Error Message */}
            {error && (
              <Animated.View entering={FadeIn} className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                <Text className="text-red-400 text-xs text-center font-body" style={{ writingDirection: 'rtl' }}>
                  {error}
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        )}

        {/* Input Text Area */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          className="border-t border-white/10 pt-4 px-5"
          style={{
            backgroundColor: '#09090B',
            paddingBottom: Math.max(insets.bottom + 10, 20),
          }}
        >
          <View className="flex-row gap-3 items-center">
            <View className="flex-1 h-12 bg-white/5 rounded-full border border-white/10 overflow-hidden flex-row items-center">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="כתוב טיעון נגדי או דעה..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 px-5 text-white text-[15px] font-body text-right h-full"
                style={{
                  writingDirection: 'rtl',
                  textAlign: 'right',
                  fontFamily: 'Assistant-Medium',
                }}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!isThinking && !isLoading}
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={!hasText || isThinking || isLoading}
              className="w-12 h-12 rounded-full items-center justify-center border overflow-hidden"
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                  backgroundColor: hasText ? Colors.primary : 'rgba(255,255,255,0.04)',
                  borderColor: hasText ? 'transparent' : 'rgba(255,255,255,0.08)',
                },
              ]}
            >
              {hasText ? (
                <View className="absolute inset-0">
                  <LinearGradient colors={[Colors.primary, '#8B152A']} style={{ flex: 1 }} />
                </View>
              ) : null}
              <Animated.View style={[sendIconStyle, { marginLeft: -2 }]}>
                <Send size={20} color="white" />
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
