import * as React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Image,
  Pressable,
  ActivityIndicator,
  I18nManager
} from 'react-native';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

import Animated, { 
  FadeInDown, 
  FadeInUp, 
} from 'react-native-reanimated';
import { useLogin } from '@/hooks/useLogin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    form,
    setForm,
    isLoading,
    showPassword,
    focusedField,
    animatedEmailStyle,
    animatedPassStyle,
    onFocus,
    onBlur,
    togglePasswordVisibility,
    handleLogin,
    navigateToRegister,
    navigateToForgotPassword,
    handleGoogleLogin,
  } = useLogin();

  return (
    <View className="flex-1 bg-black">
      {/* Cinematic Background */}
      <View className="absolute inset-0">
        <Image 
          source={require('../assets/images/cinema_background.jpg')}
          className="w-full h-full"
          resizeMode="cover"
        />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']} 
          className="absolute inset-0" 
        />
        <View className="absolute inset-0 bg-black/40" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40
          }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-end px-6">
            
            {/* Header Section - Custom LTR Layout in RTL App */}
            <Animated.View 
              entering={FadeInUp.duration(1000).delay(200).springify()}
              className="mb-12 flex-row items-start justify-between"
            >
              {/* Placeholder Element (Right side in RTL) */}
              <View className="w-24 h-32 rounded-3xl overflow-hidden border border-white/10 bg-white/5 items-center justify-center">
                <View className="absolute inset-0 bg-white/5" />
                <Image 
                  source={require('../assets/images/poster-placeholder.png')}
                  className="w-full h-full opacity-30"
                  resizeMode="cover"
                />
                <View className="absolute items-center justify-center">
                  <User size={32} color={Colors.secondary} />
                  <View className="w-8 h-1 bg-secondary/30 rounded-full mt-2" />
                </View>
              </View>

              <View className="flex-1 ml-6">
                <View className="w-16 h-1 bg-secondary rounded-full mb-6" />
                <Text style={{ fontFamily: 'Rubik-Bold', textAlign: 'left' }} className="text-white text-6xl tracking-tighter leading-tight">
                  ברוכים <Text className="text-secondary">הבאים.</Text>
                </Text>
                <Text style={{ fontFamily: 'Rubik-Regular', textAlign: 'left' }} className="text-white/60 mt-4 text-xl leading-8">
                  היכנסו אל עולם הקולנוע{'\n'}שלכם.
                </Text>
              </View>
            </Animated.View>

            {/* Login Card */}
            <Animated.View 
              entering={FadeInDown.duration(1000).delay(400).springify()}
            >
              <View 
                className="rounded-[40px] overflow-hidden border border-white/10 bg-black/60 p-8 shadow-2xl"
              >
                <View>
                  {/* Email Input */}
                  <Animated.View style={animatedEmailStyle} className="mb-5">
                    <Text style={{ fontFamily: 'Rubik-Medium', textAlign: 'left' }} className="text-white/40 text-[10px] uppercase tracking-[2px] mb-3 ml-1">כתובת אימייל</Text>
                    <View 
                      className={`flex-row items-center rounded-2xl px-4 py-4 border ${
                        focusedField === 'email' ? 'border-[#DFFF1A] bg-[#DFFF1A]/10' : 'border-white/10 bg-white/5'
                      } mb-4`}
                    >
                      <Mail size={20} color={focusedField === 'email' ? '#DFFF1A' : 'rgba(255,255,255,0.5)'} />
                      <TextInput
                        placeholder="your@email.com"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{ fontFamily: 'Rubik-Regular', marginRight: 16, textAlign: 'right' }}
                        className="flex-1 text-white text-lg"
                        value={form.email}
                        onChangeText={(val) => setForm({...form, email: val})}
                        onFocus={() => onFocus('email')}
                        onBlur={onBlur}
                        editable={!isLoading}
                      />
                    </View>
                  </Animated.View>

                  {/* Password Input */}
                  <Animated.View style={animatedPassStyle}>
                    <Text style={{ fontFamily: 'Rubik-Medium', textAlign: 'left' }} className="text-white/40 text-[10px] uppercase tracking-[2px] mb-3 ml-1">סיסמה</Text>
                    <View 
                      className={`flex-row items-center rounded-2xl px-4 py-4 border ${
                        focusedField === 'password' ? 'border-[#DFFF1A] bg-[#DFFF1A]/10' : 'border-white/10 bg-white/5'
                      } mb-6`}
                    >
                      <Lock size={20} color={focusedField === 'password' ? '#DFFF1A' : 'rgba(255,255,255,0.5)'} />
                      <TextInput
                        placeholder="הזן סיסמה"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        secureTextEntry={!showPassword}
                        style={{ fontFamily: 'Rubik-Regular', flex: 1, marginHorizontal: 16, textAlign: 'right' }}
                        className="text-white text-lg"
                        value={form.password}
                        onChangeText={(val) => setForm({...form, password: val})}
                        onFocus={() => onFocus('password')}
                        onBlur={onBlur}
                        editable={!isLoading}
                      />
                      <TouchableOpacity onPress={togglePasswordVisibility}>
                        {showPassword ? (
                          <EyeOff size={20} color={focusedField === 'password' ? '#DFFF1A' : 'rgba(255,255,255,0.5)'} />
                        ) : (
                          <Eye size={20} color={focusedField === 'password' ? '#DFFF1A' : 'rgba(255,255,255,0.5)'} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                  <Pressable onPress={navigateToForgotPassword} className="mt-4 mb-8 self-start px-2">
                    <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-secondary/80 text-sm">שכחתם סיסמה?</Text>
                  </Pressable>

                  {/* Login Button */}
                  <TouchableOpacity 
                    onPress={handleLogin}
                    disabled={isLoading}
                    className="bg-[#DFFF1A] py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
                    style={{ shadowColor: '#DFFF1A', shadowOpacity: 0.2 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="black" />
                    ) : (
                      <>
                        <Text className="text-black text-xl font-bold ml-2" style={{ fontFamily: 'Rubik-Bold' }}>
                          התחברות
                        </Text>
                        {I18nManager.isRTL ? <ArrowLeft size={22} color="black" /> : <ArrowRight size={22} color="black" />}
                      </>
                    )}
                  </TouchableOpacity>

                  <View className="flex-row items-center my-8 w-full">
                    <View className="flex-1 h-[0.5px] bg-white/10" />
                    <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-white/20 mx-4 text-[10px] uppercase tracking-widest">או המשיכו עם</Text>
                    <View className="flex-1 h-[0.5px] bg-white/10" />
                  </View>

                  <TouchableOpacity 
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/20 shadow-xl"
                  >
                    <Image 
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                      className="w-6 h-6 mr-3"
                    />
                    <Text className="text-white text-lg font-semibold" style={{ fontFamily: 'Rubik-Medium' }}>
                      התחברות עם Google
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              entering={FadeInUp.duration(1000).delay(600).springify()}
              className="flex-row justify-center items-center mt-12 mb-6"
            >
              <Text style={{ fontFamily: 'Rubik-Regular' }} className="text-white/40 text-base">אין לכם חשבון? </Text>
              <Pressable onPress={navigateToRegister}>
                <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-secondary text-base">הצטרפו למועדון</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
