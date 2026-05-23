/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Clock, AlertTriangle, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, LinearTransition, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Colors, Typography } from '@/constants/Theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

const SERVER_URL = 'https://movie-app-server-olet.onrender.com';

interface Message {
  id: string;
  user: string;
  text: string;
  isSystem: boolean;
}

export default function SpoilerLoungeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { title = "הסרט" } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', user: 'מערכת', text: `ברוכים הבאים ללאונג' הספוילרים של ${title}!\nהחדר יהיה פתוח לשעתיים הקרובות. (מתחבר לשרת...)`, isSystem: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState('01:59:45');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
      socketRef.current?.emit('join_room', { room: title });
    });

    socketRef.current.on('chat_history', (history: Message[]) => {
      if (history && history.length > 0) {
        setMessages(history);
      }
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    });

    socketRef.current.on('receive_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [title]);

  const hasText = inputText.trim().length > 0;
  const sendIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scaleX: -1 },
        { scale: withSpring(hasText ? 1.15 : 1, { mass: 0.5, damping: 12 }) },
        { rotate: withSpring(hasText ? '-15deg' : '0deg', { mass: 0.5, damping: 12 }) },
      ],
      opacity: withTiming(hasText ? 1 : 0.4, { duration: 200 })
    };
  });

  const sendMessage = () => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newMsg = {
      id: Date.now().toString(),
      user: user?.name || 'אורח',
      text: inputText.trim(),
      isSystem: false,
      room: title,
      timestamp: Date.now()
    };

    if (socketRef.current) {
      socketRef.current.emit('send_message', newMsg);
    }
    
    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      {/* Premium Cinematic Background */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={['#1F0F29', '#0A0A0A', '#130B1A']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Subtle glow orb in the background */}
        <View style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.15, filter: 'blur(80px)' }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Liquid Glass Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ zIndex: 10 }}>
          <BlurView 
            intensity={60} 
            tint="dark" 
            style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}
          >
            <View className="px-5 flex-row items-center justify-between">
              <Pressable 
                onPress={() => router.back()} 
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 justify-center items-center"
              >
                <ChevronRight color="white" size={24} />
              </Pressable>

              {/* Title - Absolutely centered */}
              <View className="absolute left-0 right-0 items-center justify-center pointer-events-none">
                <Text style={[Typography.h3, { fontFamily: 'Rubik-Bold', color: 'white', marginBottom: 2 }]} numberOfLines={1}>לאונג' ספוילרים</Text>
                <Text style={[Typography.caption, { color: Colors.secondary, fontFamily: 'Rubik-Medium' }]} numberOfLines={1}>{title}</Text>
              </View>

              <View style={{ zIndex: 10 }}>
                <View className="items-center justify-center bg-[#00d2ff]/10 border border-[#00d2ff]/30 px-3.5 py-2 rounded-full flex-row gap-2 shadow-lg shadow-[#00d2ff]/20">
                  <Clock size={14} color="#00d2ff" />
                  <Text className="text-[12px] text-[#00d2ff] font-display font-bold tracking-widest">{timeLeft}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Warning Banner */}
        <Animated.View entering={FadeIn.delay(300)} style={{ zIndex: 9, marginTop: -1 }}>
          <BlurView intensity={30} tint="dark" className="border-b border-[#FFB142]/20 p-2.5 flex-row items-center justify-center gap-2 bg-[#FFB142]/10">
            <AlertTriangle size={14} color="#FFB142" />
            <Text className="text-[12px] text-[#FFB142] font-bold tracking-wide" style={{ writingDirection: 'ltr', fontFamily: 'Rubik-Medium', textAlign: 'left' }}>אזהרה: החדר מכיל ספוילרים לסרט!</Text>
          </BlurView>
        </Animated.View>

        {/* Messages Area */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-5 pt-6" 
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, idx) => {
            const isMe = msg.user === (user?.name || 'אורח');
            
            if (msg.isSystem) {
              return (
                <Animated.View 
                  key={msg.id} 
                  layout={LinearTransition.springify()}
                  entering={FadeInDown.delay(idx * 50).springify()}
                  className="self-center mb-6 max-w-[90%]"
                >
                  <BlurView intensity={20} tint="light" className="px-5 py-3 rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                    <Text className="text-[12px] text-white/70 font-body text-center leading-5" style={{ writingDirection: 'ltr' }}>
                      {msg.text}
                    </Text>
                  </BlurView>
                </Animated.View>
              );
            }

            return (
              <Animated.View 
                key={msg.id} 
                layout={LinearTransition.springify()}
                entering={FadeInDown.delay(idx * 50).springify()}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: 16,
                  maxWidth: '82%',
                }}
              >
                {!isMe && (
                  <Text className="text-[12px] font-bold mb-1.5 opacity-90 ms-1" style={{ writingDirection: 'ltr', color: Colors.secondary, textAlign: 'left' }}>
                    {msg.user}
                  </Text>
                )}
                
                {isMe ? (
                  <LinearGradient
                    colors={[Colors.primary, '#8B152A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      padding: 14,
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      borderBottomRightRadius: 4,
                      borderBottomLeftRadius: 20,
                      shadowColor: Colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    <Text className="text-[15px] text-white font-body" style={{ writingDirection: 'ltr', textAlign: 'left', lineHeight: 22 }}>
                      {msg.text}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View 
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      padding: 14,
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      borderBottomRightRadius: 20,
                      borderBottomLeftRadius: 4,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Text className="text-[15px] text-white/95 font-body" style={{ writingDirection: 'ltr', textAlign: 'left', lineHeight: 22 }}>
                      {msg.text}
                    </Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Premium Input Area */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          className="bg-[#0A0A0A]/95 border-t border-white/10 pt-4 px-5"
          style={{ paddingBottom: Math.max(insets.bottom + 10, 20) }}
        >
          <View className="flex-row gap-3 items-center">
            <View className="flex-1 h-12 bg-white/5 rounded-full border border-white/10 overflow-hidden flex-row items-center">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="שתף את דעתך על הסרט..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 px-5 text-white text-[15px] font-body text-right h-full"
                style={{ writingDirection: 'rtl', textAlign: 'right' }}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
            </View>

            <Pressable 
              onPress={sendMessage}
              className="w-12 h-12 rounded-full items-center justify-center border overflow-hidden"
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.92 : 1 }],
                backgroundColor: hasText ? Colors.primary : 'rgba(255,255,255,0.05)',
                borderColor: hasText ? 'transparent' : 'rgba(255,255,255,0.1)'
              }]}
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
