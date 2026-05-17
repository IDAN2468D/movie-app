/**
 * Forgot Password Screen - Premium Cinematic Experience
 */
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ImageBackground,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Mail, ChevronLeft } from 'lucide-react-native';
import { Typography } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useForgotPassword } from '@/hooks/useForgotPassword';

export default function ForgotPasswordScreen() {
  const {
    email,
    setEmail,
    isLoading,
    focusedField,
    handleResetPassword,
    navigateBack,
    handleFocus,
    handleBlur,
    animatedEmailStyle,
  } = useForgotPassword();

  return (
    <View className="flex-1 bg-black">
      <ImageBackground 
        source={require('../../assets/images/cinema_background.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'black']}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <View className="absolute top-12 left-6 z-10">
        <TouchableOpacity 
          onPress={navigateBack}
          className="w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/20 backdrop-blur-md"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        style={{ direction: 'ltr' }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-end px-6 pb-12">
            
            <Animated.View entering={FadeInUp.duration(1000).springify()} style={{ alignItems: 'flex-start' }}>
              <Text style={[Typography.hero, { fontFamily: 'Rubik-Bold', textAlign: 'left' }]} className="text-white text-5xl leading-tight w-full">
                שכחתם{'\n'}
                <Text className="text-[#E50914]">סיסמה?</Text>
              </Text>
              <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'left' }]} className="text-white/60 mt-4 mb-10 text-lg w-full">
                אל דאגה, הכניסו את המייל שלכם ונשלח לכם קישור לאיפוס מיידי.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
              <View className="rounded-[32px] overflow-hidden p-6 border border-white/10 bg-surface">
                {isLoading ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text className="text-white/60 mt-4 font-[Rubik-Regular]">שולח קישור...</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'flex-start' }}>
                    {/* Email */}
                    <Animated.View 
                      style={[animatedEmailStyle]}
                      className={`flex-row items-center rounded-2xl px-4 py-4 mb-8 w-full border-2 ${
                        focusedField === 'email' ? 'border-[#E50914] bg-[#E50914]/5' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Mail 
                        size={20} 
                        color={focusedField === 'email' ? '#E50914' : 'rgba(255,255,255,0.5)'} 
                      />
                      <TextInput
                        placeholder="כתובת אימייל"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{ fontFamily: 'Rubik-Regular', marginLeft: 12, textAlign: 'left' }}
                        className="flex-1 text-white text-base"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => handleFocus('email')}
                        onBlur={handleBlur}
                      />
                    </Animated.View>

                    <TouchableOpacity 
                      onPress={handleResetPassword}
                      className="w-full bg-[#E50914] rounded-2xl py-4 items-center flex-row justify-center shadow-lg shadow-red-600/30"
                    >
                      <Text style={[Typography.h3, { fontFamily: 'Rubik-Bold', marginRight: 8 }]} className="text-white">שליחת קישור</Text>
                      <ChevronLeft size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400).duration(1000)}
              className="flex-row justify-center items-center mt-10"
            >
              <TouchableOpacity onPress={navigateBack}>
                <Text style={[Typography.body, { fontFamily: 'Rubik-Bold' }]} className="text-[#E50914]">חזרה למסך הכניסה</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
