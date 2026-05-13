/**
 * Register Screen - Premium Cinematic Experience
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
import { Mail, Lock, User, ChevronLeft } from 'lucide-react-native';
import { Typography } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRegister } from '@/hooks/useRegister';

export default function RegisterScreen() {
  const {
    form,
    setForm,
    isLoading,
    handleRegister,
    navigateToLogin,
  } = useRegister();

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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-end px-6 pb-12">
            
            <Animated.View entering={FadeInUp.duration(1000).springify()} className="items-end">
              <Text style={[Typography.hero, { fontFamily: 'Rubik-Bold', textAlign: 'left' }]} className="text-white text-5xl leading-tight w-full">
                יצירת{'\n'}
                <Text className="text-[#E50914]">חשבון חדש.</Text>
              </Text>
              <Text style={[Typography.body, { fontFamily: 'Rubik-Regular', textAlign: 'left' }]} className="text-white/60 mt-4 mb-8 text-lg w-full">
                הצטרפו לקהילת חובבי הקולנוע שלנו ותיהנו מחוויה מותאמת אישית.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
              <View className="rounded-[32px] overflow-hidden p-6 border border-white/10 bg-surface">
                {isLoading ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text className="text-white/60 mt-4 font-[Rubik-Regular]">יוצר חשבון...</Text>
                  </View>
                ) : (
                  <View className="items-start">
                    {/* Name */}
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-4 w-full">
                      <User size={20} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        placeholder="שם מלא"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        style={{ fontFamily: 'Rubik-Regular' }}
                        className="flex-1 ms-3 text-white text-base text-right"
                        value={form.name}
                        onChangeText={(val) => setForm({...form, name: val})}
                      />
                    </View>

                    {/* Email */}
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-4 w-full">
                      <Mail size={20} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        placeholder="כתובת אימייל"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{ fontFamily: 'Rubik-Regular' }}
                        className="flex-1 ms-3 text-white text-base text-right"
                        value={form.email}
                        onChangeText={(val) => setForm({...form, email: val})}
                      />
                    </View>

                    {/* Password */}
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-4 w-full">
                      <Lock size={20} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        placeholder="סיסמה"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry
                        style={{ fontFamily: 'Rubik-Regular' }}
                        className="flex-1 ms-3 text-white text-base text-right"
                        value={form.password}
                        onChangeText={(val) => setForm({...form, password: val})}
                      />
                    </View>

                    {/* Confirm Password */}
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-8 w-full">
                      <Lock size={20} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        placeholder="אימות סיסמה"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry
                        style={{ fontFamily: 'Rubik-Regular' }}
                        className="flex-1 ms-3 text-white text-base text-right"
                        value={form.confirmPassword}
                        onChangeText={(val) => setForm({...form, confirmPassword: val})}
                      />
                    </View>

                    <TouchableOpacity 
                      onPress={handleRegister}
                      className="w-full bg-[#E50914] rounded-2xl py-4 items-center flex-row justify-center shadow-lg shadow-red-600/30"
                    >
                      <Text style={[Typography.h3, { fontFamily: 'Rubik-Bold' }]} className="text-white me-2">הרשמה</Text>
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
              <Text style={[Typography.body, { fontFamily: 'Rubik-Regular' }]} className="text-white/60">כבר רשומים? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={[Typography.body, { fontFamily: 'Rubik-Bold' }]} className="text-[#E50914]">התחברו כאן</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
