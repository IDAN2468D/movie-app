import React, { useState } from 'react';
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
  StyleSheet,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, User as UserIcon, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { Typography, Colors } from '../../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('מידע חסר', 'נא למלא את כל השדות הנדרשים');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('אי התאמה בסיסמה', 'הסיסמאות אינן תואמות');
      return;
    }

    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('שגיאה בהרשמה', result.message || 'משהו השתבש');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ImageBackground 
        source={require('../../assets/images/auth_bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'black']}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 px-6 pt-16 pb-12">
            
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-12 h-12 items-center justify-center rounded-2xl bg-white/10 border border-white/10 mb-8 self-start"
            >
              <ChevronRight size={24} color="white" />
            </TouchableOpacity>

            <Animated.View entering={FadeInUp.duration(800).springify()} className="items-start">
              <Text style={[Typography.hero, { fontFamily: 'Rubik-Bold' }]} className="text-white text-4xl w-full">
                יצירת חשבון
              </Text>
              <Text style={[Typography.body, { fontFamily: 'Rubik-Regular' }]} className="text-white/60 mt-2 mb-8 w-full">
                הצטרפו לקהילת הקולנוע שלנו ותיהנו מתכונות בלעדיות.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
              <View className="rounded-[32px] overflow-hidden p-6 border border-white/10 bg-surface">
                <View className="space-y-4">
                  {/* Name */}
                  <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-4">
                    <UserIcon size={20} color="rgba(255,255,255,0.5)" />
                    <TextInput
                      placeholder="שם מלא"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      style={{ fontFamily: 'Rubik-Regular' }}
                      className="flex-1 ms-3 text-white text-base"
                      value={form.name}
                      onChangeText={(val) => setForm({...form, name: val})}
                    />
                  </View>

                  {/* Email */}
                  <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-4">
                    <Mail size={20} color="rgba(255,255,255,0.5)" />
                    <TextInput
                      placeholder="כתובת אימייל"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{ fontFamily: 'Rubik-Regular' }}
                      className="flex-1 ms-3 text-white text-base"
                      value={form.email}
                      onChangeText={(val) => setForm({...form, email: val})}
                    />
                  </View>

                  {/* Password */}
                  <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-4">
                    <Lock size={20} color="rgba(255,255,255,0.5)" />
                    <TextInput
                      placeholder="סיסמה"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      secureTextEntry
                      style={{ fontFamily: 'Rubik-Regular' }}
                      className="flex-1 ms-3 text-white text-base"
                      value={form.password}
                      onChangeText={(val) => setForm({...form, password: val})}
                    />
                  </View>

                  {/* Confirm Password */}
                  <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-4">
                    <Lock size={20} color="rgba(255,255,255,0.5)" />
                    <TextInput
                      placeholder="אימות סיסמה"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      secureTextEntry
                      style={{ fontFamily: 'Rubik-Regular' }}
                      className="flex-1 ms-3 text-white text-base"
                      value={form.confirmPassword}
                      onChangeText={(val) => setForm({...form, confirmPassword: val})}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={handleRegister}
                  disabled={isLoading}
                  className="bg-[#E50914] rounded-2xl py-4 items-center flex-row justify-center mt-8 shadow-lg shadow-red-600/30"
                >
                  <Text style={[Typography.h3, { fontFamily: 'Rubik-Bold' }]} className="text-white me-2">
                    {isLoading ? 'יוצר חשבון...' : 'מתחילים'}
                  </Text>
                  <ChevronLeft size={20} color="white" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400).duration(1000)}
              className="flex-row justify-center items-center mt-10"
            >
              <Text style={[Typography.body, { fontFamily: 'Rubik-Regular' }]} className="text-white/60"> כבר יש לכם חשבון? </Text>
              <TouchableOpacity onPress={() => router.push('/')}>
                <Text style={[Typography.body, { fontFamily: 'Rubik-Bold' }]} className="text-[#E50914]">התחברות</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
