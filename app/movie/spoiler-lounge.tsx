/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Clock, AlertTriangle, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, LinearTransition, Layout } from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function SpoilerLoungeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { title = "הסרט" } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState([
    { id: '1', user: 'מערכת', text: `ברוכים הבאים ללאונג' הספוילרים של ${title}! החדר יהיה פתוח לשעתיים הקרובות.`, isSystem: true },
    { id: '2', user: 'יעל', text: 'וואו איזה סוף מטורף! לא ציפיתי לזה בכלל 😱', isSystem: false },
    { id: '3', user: 'דניאל', text: 'מישהו הבין מה קרה בסצנה שאחרי הקרדיטים?', isSystem: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState('01:59:45');

  const sendMessage = () => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'אני',
      text: inputText.trim(),
      isSystem: false
    }]);
    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Dynamic Background */}
      <View className="absolute inset-0 opacity-20">
        <LinearGradient
          colors={['#1a1025', Colors.background, '#2a0a18']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Premium Header */}
        <Animated.View entering={FadeInDown.duration(400)} className="bg-surface/80 border-b border-white/10" style={{ paddingTop: insets.top }}>
          <View className="px-5 py-4 flex-row items-center justify-between">
            <Pressable 
              onPress={() => router.back()} 
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 justify-center items-center"
            >
              <ChevronLeft color={Colors.text} size={24} />
            </Pressable>
            <View className="items-center flex-1 mx-4">
              <Text className="text-h3 text-white font-display mb-1" numberOfLines={1}>לאונג' ספוילרים</Text>
              <Text className="text-[12px] text-secondary font-bold" numberOfLines={1}>{title}</Text>
            </View>
            <View className="items-center justify-center bg-secondary/10 border border-secondary/20 px-3 py-1.5 rounded-full flex-row gap-1.5 shadow-sm shadow-secondary/10">
              <Clock size={12} color={Colors.secondary} />
              <Text className="text-[10px] text-secondary font-display font-bold tracking-wider">{timeLeft}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Warning Banner */}
        <Animated.View entering={FadeIn.delay(300)} className="bg-[#FFB142]/10 border-b border-[#FFB142]/20 p-2.5 flex-row items-center justify-center gap-2">
          <AlertTriangle size={14} color="#FFB142" />
          <Text className="text-[11px] text-[#FFB142] font-bold tracking-wide" style={{ writingDirection: 'rtl' }}>אזהרה: החדר מכיל ספוילרים לסרט!</Text>
        </Animated.View>

        {/* Messages Area */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-5 pt-4" 
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, idx) => (
            <Animated.View 
              key={msg.id} 
              layout={LinearTransition.springify()}
              entering={FadeInDown.delay(idx * 50).springify()}
              className={`mb-4 max-w-[85%] p-3.5 rounded-[20px] ${
                msg.isSystem 
                  ? 'self-center bg-white/5 border border-white/10 px-6 rounded-full' 
                  : msg.user === 'אני' 
                    ? 'self-end bg-primary border border-primary/50 rounded-br-sm shadow-lg shadow-primary/20' 
                    : 'self-start bg-surfaceLight border border-white/5 rounded-bl-sm shadow-md shadow-black/20'
              }`}
            >
              {!msg.isSystem && msg.user !== 'אני' && (
                <Text className="text-[11px] text-secondary font-bold mb-1.5 opacity-90" style={{ writingDirection: 'rtl' }}>{msg.user}</Text>
              )}
              <Text 
                className={`text-[15px] font-body ${msg.isSystem ? 'text-textMuted text-xs font-bold' : 'text-white'}`} 
                style={{ 
                  writingDirection: 'rtl', 
                  textAlign: msg.isSystem ? 'center' : 'right',
                  lineHeight: 22
                }}
              >
                {msg.text}
              </Text>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Premium Input Area */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          className="bg-surface/90 border-t border-white/10 pt-3 px-5"
          style={{ paddingBottom: Math.max(insets.bottom + 10, 20) }}
        >
          <View className="flex-row gap-3 items-center">
            <View className="flex-1 h-12 bg-black/40 rounded-full border border-white/10 overflow-hidden">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="שתף את דעתך על הסרט..."
                placeholderTextColor={Colors.textMuted}
                className="flex-1 px-5 text-white text-[15px] font-body text-right h-full"
                style={{ writingDirection: 'rtl' }}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
            </View>
            <Pressable 
              onPress={sendMessage}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-secondary/30 ${inputText.trim() ? 'bg-secondary' : 'bg-surfaceLight border border-white/10'}`}
            >
              <Send size={18} color={inputText.trim() ? Colors.background : Colors.textMuted} style={{ transform: [{ scaleX: -1 }], marginLeft: -2 }} />
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
