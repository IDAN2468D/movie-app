import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert,
  ImageBackground,
  Dimensions,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { Typography, Colors } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '../constants/Config';

import Constants from 'expo-constants';

export default function Index() {
  const router = useRouter();
  const { login, loginWithGoogleToken, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Configure Google Sign-In
  useEffect(() => {
    console.log('Configuring Google Sign-In with IDs:', {
      web: GOOGLE_CONFIG.web ? GOOGLE_CONFIG.web.substring(0, 15) + '...' : 'MISSING',
      webLength: GOOGLE_CONFIG.web?.length,
    });

    GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.web,
      iosClientId: GOOGLE_CONFIG.ios,
    });
    
    console.log('Native Google Sign-In Configured');
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא להזין אימייל וסיסמה');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('ההתחברות נכשלה', result.message || 'נא לבדוק את פרטי ההתחברות');
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    const result = await loginWithGoogleToken(idToken);
    if (!result.success) {
      Alert.alert('ההתחברות נכשלה', result.message || 'שגיאה בחיבור לחשבון גוגל');
    }
  };

  const triggerGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Accessing data from the new response format of @react-native-google-signin/google-signin
      const idToken = userInfo.data?.idToken;
      
      if (idToken) {
        console.log('Native Google Auth Success! ID Token length:', idToken.length);
        handleGoogleLogin(idToken);
      } else {
        console.error('No ID Token found in native Google response');
        Alert.alert('שגיאה', 'לא התקבל מזהה (Token) מגוגל');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Google login cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Google login already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('שגיאה', 'שירותי Google Play אינם זמינים');
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert('שגיאה', 'התחברות נכשלה: ' + (error.message || 'שגיאה לא ידועה'));
      }
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ImageBackground 
        source={require('../assets/images/auth_bg.png')}
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
            
            <Animated.View entering={FadeInUp.duration(1000).springify()} className="items-start">
              <Text style={[Typography.hero, { fontFamily: 'Rubik-Bold' }]} className="text-white text-5xl leading-tight w-full">
                לצפות{'\n'}
                <Text className="text-[#E50914]">בכל מקום.</Text>
              </Text>
              <Text style={[Typography.body, { fontFamily: 'Rubik-Regular' }]} className="text-white/60 mt-4 mb-10 text-lg w-full">
                התחברו כדי לצפות בכרטיסים שלכם, ברשימת הצפייה ובהמלצות אישיות.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
              <View className="rounded-[32px] overflow-hidden p-6 border border-white/10 bg-surface">
                {isLoading ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text className="text-white/60 mt-4 font-[Rubik-Regular]">בודק חיבור...</Text>
                  </View>
                ) : (
                  <View className="items-start">
                    {/* Email */}
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-4 w-full">
                      <Mail size={20} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        placeholder="כתובת אימייל"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{ fontFamily: 'Rubik-Regular' }}
                        className="flex-1 ms-3 text-white text-base"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    {/* Password */}
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 w-full">
                      <Lock size={20} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        placeholder="סיסמה"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry
                        style={{ fontFamily: 'Rubik-Regular' }}
                        className="flex-1 ms-3 text-white text-base"
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>

                    <TouchableOpacity className="mt-4 w-full">
                      <Text className="text-white/40 text-sm font-[Rubik-Regular]">שכחתם סיסמה?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={handleLogin}
                      disabled={isLoading}
                      className="bg-[#E50914] rounded-2xl py-4 items-center flex-row justify-center mt-8 shadow-lg shadow-red-600/30 w-full"
                    >
                      <Text style={[Typography.h3, { fontFamily: 'Rubik-Bold' }]} className="text-white me-2">
                        התחברות
                      </Text>
                      <ChevronLeft size={20} color="white" />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-6 w-full">
                      <View className="flex-1 h-[1px] bg-white/10" />
                      <Text className="text-white/30 mx-4 text-xs font-[Rubik-Regular]">או התחברו באמצעות</Text>
                      <View className="flex-1 h-[1px] bg-white/10" />
                    </View>

                    {/* Google Login Button */}
                    <TouchableOpacity 
                      onPress={triggerGoogleLogin}
                      disabled={isLoading}
                      className="bg-white rounded-2xl py-4 items-center flex-row justify-center w-full"
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
                    >
                      <FontAwesome name="google" size={20} color="#4285F4" />
                      <Text style={[Typography.h3, { fontFamily: 'Rubik-Medium', color: '#1A1A1A' }]} className="ms-3">
                        המשך עם Google
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>

            {!isLoading && (
              <Animated.View 
                entering={FadeInDown.delay(400).duration(1000)}
                className="flex-row justify-center items-center mt-10"
              >
                <Text style={[Typography.body, { fontFamily: 'Rubik-Regular' }]} className="text-white/60"> חדשים ב-CineBook? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text style={[Typography.body, { fontFamily: 'Rubik-Bold' }]} className="text-[#E50914]">להרשמה עכשיו</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
