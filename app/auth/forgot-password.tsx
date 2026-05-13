/**
 * Forgot Password Screen - Premium Cinematic Experience
 */
import React from 'react';
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
import { Mail, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { Typography } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useForgotPassword } from '@/hooks/useForgotPassword';

export default function ForgotPasswordScreen() {
  const {
    email,
    setEmail,
    isLoading,
    handleResetPassword,
    navigateBack,
  } = useForgotPassword();

  return (
    <View className="flex-1 bg-black">
      <ImageBackground 
        source={require('../../assets/images/auth_bg.png')}
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
          <ArrowRight size={24} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-end px-6 pb-12">
            
            <Animated.View entering={FadeInUp.duration(1000).springify()} className="items-end">
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
                  <View className="items-start">
                    {/* Email */}
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-8 w-full">
                      <Mail size={20} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        placeholder="כתובת אימייל"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{ fontFamily: 'Rubik-Regular' }}
                        className="flex-1 ms-3 text-white text-base text-right"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    <TouchableOpacity 
                      onPress={handleResetPassword}
                      className="w-full bg-[#E50914] rounded-2xl py-4 items-center flex-row justify-center shadow-lg shadow-red-600/30"
                    >
                      <Text style={[Typography.h3, { fontFamily: 'Rubik-Bold' }]} className="text-white me-2">שליחת קישור</Text>
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
