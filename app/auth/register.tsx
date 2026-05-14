/**
 * Register Screen - Premium Cinematic Experience
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
  Image,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { Mail, Lock, User, ChevronRight, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useRegister } from '@/hooks/useRegister';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const {
    form,
    setForm,
    isLoading,
    handleRegister,
    navigateToLogin,
    handleGoogleLogin,
  } = useRegister();
  
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animated focus styles
  const nameScale = useSharedValue(1);
  const emailScale = useSharedValue(1);
  const passScale = useSharedValue(1);

  const onFocus = (field: string) => {
    setFocusedField(field);
    if (field === 'name') nameScale.value = withSpring(1.02);
    if (field === 'email') emailScale.value = withSpring(1.02);
    if (field === 'password') passScale.value = withSpring(1.02);
  };

  const onBlur = () => {
    setFocusedField(null);
    nameScale.value = withSpring(1);
    emailScale.value = withSpring(1);
    passScale.value = withSpring(1);
  };

  const animatedNameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nameScale.value }]
  }));

  const animatedEmailStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emailScale.value }]
  }));

  const animatedPassStyle = useAnimatedStyle(() => ({
    transform: [{ scale: passScale.value }]
  }));

  return (
    <View className="flex-1 bg-black">
      {/* Cinematic Background */}
      <View className="absolute inset-0">
        <Image 
          source={require('../../assets/images/cinema_background.jpg')}
          className="w-full h-full"
          resizeMode="cover"
        />
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']} 
          className="absolute inset-0" 
        />
        <BlurView intensity={20} tint="dark" className="absolute inset-0" />
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
              className="mb-10 flex-row items-start justify-between"
            >
              {/* Placeholder Element (Right side in RTL) */}
              <View className="w-24 h-32 rounded-3xl overflow-hidden border border-white/10 bg-white/5 items-center justify-center">
                <BlurView intensity={20} className="absolute inset-0" />
                <Image 
                  source={require('../../assets/images/poster-placeholder.png')}
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
                <Text style={{ fontFamily: 'Rubik-Bold', textAlign: 'left' }} className="text-white text-5xl tracking-tighter leading-tight">
                  הצטרפו ל<Text className="text-secondary">מועדון.</Text>
                </Text>
                <Text style={{ fontFamily: 'Rubik-Regular', textAlign: 'left' }} className="text-white/60 mt-4 text-lg leading-8">
                  הצטרפו לחוויה קולנועית{'\n'}שטרם הכרתם.
                </Text>
              </View>
            </Animated.View>

            {/* Register Card */}
            <Animated.View 
              entering={FadeInDown.duration(1000).delay(400).springify()}
            >
              <BlurView 
                intensity={60} 
                tint="dark" 
                className="rounded-[40px] overflow-hidden border border-white/10 bg-white/5 p-8 shadow-2xl"
              >
                {isLoading ? (
                  <View className="py-20 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.secondary} />
                    <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-white/60 mt-6 text-lg">יוצרים את הכיסא שלך...</Text>
                  </View>
                ) : (
                  <View>
                    {/* Name Input */}
                    <Animated.View style={animatedNameStyle} className="mb-4">
                      <Text style={{ fontFamily: 'Rubik-Medium', textAlign: 'left' }} className="text-white/40 text-[10px] uppercase tracking-[2px] mb-2 ml-1">שם מלא</Text>
                      <View 
                        className={`flex-row items-center rounded-2xl px-4 py-4 border ${
                          focusedField === 'name' ? 'border-[#DFFF1A] bg-[#DFFF1A]/10' : 'border-white/10 bg-white/5'
                        } mb-4`}
                      >
                        <User size={20} color={focusedField === 'name' ? '#DFFF1A' : 'rgba(255,255,255,0.5)'} />
                        <TextInput
                          placeholder="John Doe"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          style={{ fontFamily: 'Rubik-Regular', marginRight: 16, textAlign: 'right' }}
                          className="flex-1 text-white text-base"
                          value={form.name}
                          onChangeText={(val) => setForm({...form, name: val})}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                    </Animated.View>

                    {/* Email Input */}
                    <Animated.View style={animatedEmailStyle} className="mb-4">
                      <Text style={{ fontFamily: 'Rubik-Medium', textAlign: 'left' }} className="text-white/40 text-[10px] uppercase tracking-[2px] mb-2 ml-1">כתובת אימייל</Text>
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
                          className="flex-1 text-white text-base"
                          value={form.email}
                          onChangeText={(val) => setForm({...form, email: val})}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                    </Animated.View>

                    {/* Password Input */}
                    <Animated.View style={animatedPassStyle}>
                      <Text style={{ fontFamily: 'Rubik-Medium', textAlign: 'left' }} className="text-white/40 text-[10px] uppercase tracking-[2px] mb-2 ml-1">סיסמה</Text>
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
                          className="text-white text-base"
                          value={form.password}
                          onChangeText={(val) => setForm({...form, password: val})}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <EyeOff size={20} color={focusedField === 'password' ? '#DFFF1A' : 'rgba(255,255,255,0.5)'} />
                          ) : (
                            <Eye size={20} color={focusedField === 'password' ? '#DFFF1A' : 'rgba(255,255,255,0.5)'} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </Animated.View>

                    {/* Register Button */}
                    <TouchableOpacity 
                      onPress={handleRegister}
                      disabled={isLoading}
                      className="bg-[#DFFF1A] py-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-[#DFFF1A]/20"
                    >
                      <Text className="text-black text-xl font-bold ml-2" style={{ fontFamily: 'Rubik-Bold' }}>
                        יצירת חשבון
                      </Text>
                      <ArrowLeft size={22} color="black" />
                    </TouchableOpacity>

                    <View className="flex-row items-center my-6 w-full">
                      <View className="flex-1 h-[0.5px] bg-white/10" />
                      <Text style={{ fontFamily: 'Rubik-Medium' }} className="text-white/20 mx-4 text-[10px] uppercase tracking-widest">או</Text>
                      <View className="flex-1 h-[0.5px] bg-white/10" />
                    </View>

                    <TouchableOpacity 
                      onPress={handleGoogleLogin}
                      className="flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/20 shadow-xl"
                    >
                      <Image 
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                        className="w-6 h-6 mr-3"
                      />
                      <Text className="text-white text-lg font-semibold" style={{ fontFamily: 'Rubik-Medium' }}>
                        הצטרפו עם Google
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </BlurView>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              entering={FadeInUp.duration(1000).delay(600).springify()}
              className="flex-row justify-center items-center mt-10 mb-6"
            >
              <Text style={{ fontFamily: 'Rubik-Regular' }} className="text-white/40 text-base">כבר יש לכם חשבון? </Text>
              <Pressable onPress={navigateToLogin}>
                <Text style={{ fontFamily: 'Rubik-Bold' }} className="text-secondary text-base">התחברו כאן</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
