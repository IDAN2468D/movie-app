import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '@/constants/Config';
import { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

export const useLogin = () => {
  const { login, isLoading } = useAuthStore();
  
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animated focus styles
  const emailScale = useSharedValue(1);
  const passScale = useSharedValue(1);

  const onFocus = (field: string) => {
    setFocusedField(field);
    if (field === 'email') emailScale.value = withSpring(1.02);
    if (field === 'password') passScale.value = withSpring(1.02);
  };

  const onBlur = () => {
    setFocusedField(null);
    emailScale.value = withSpring(1);
    passScale.value = withSpring(1);
  };

  const animatedEmailStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emailScale.value }]
  }));

  const animatedPassStyle = useAnimatedStyle(() => ({
    transform: [{ scale: passScale.value }]
  }));

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = useCallback(async () => {
    if (!form.email || !form.password) {
      Alert.alert('מידע חסר', 'נא למלא את כל השדות');
      return;
    }

    const result = await login(form.email, form.password);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('שגיאת התחברות', result.message || 'אימייל או סיסמה שגויים');
    }
  }, [form, login]);

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleGoogleLogin = async () => {
    console.log('--- Google Sign-In Started ---');
    try {
      if (!GOOGLE_CONFIG.web) {
        console.error('GOOGLE_CONFIG.web is missing');
        Alert.alert('שגיאת הגדרה', 'חסר מזהה לקוח של גוגל (Web Client ID)');
        return;
      }

      console.log('Configuring Google Sign-In with Web Client ID:', GOOGLE_CONFIG.web);
      GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.web,
        offlineAccess: true,
      });

      console.log('Checking for Play Services...');
      await GoogleSignin.hasPlayServices();
      
      console.log('Launching Google Sign-In...');
      const response = await GoogleSignin.signIn();
      console.log('Google Sign-In Response Received:', JSON.stringify(response, null, 2));
      
      if (response.type !== 'success') {
        console.warn('Google Sign-In was not "success" type. Type:', response.type);
        throw new Error('Google Sign-In was not successful');
      }

      const idToken = response.data.idToken;
      console.log('ID Token status:', idToken ? 'Token Found (Length: ' + idToken.length + ')' : 'Token NOT Found');
      
      if (!idToken) {
        throw new Error('No ID Token found');
      }

      console.log('Sending ID Token to Backend...');
      const result = await useAuthStore.getState().loginWithGoogleToken(idToken);
      console.log('Backend Response for Google Login:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('Google Login SUCCESS - Navigating to Tabs');
        router.replace('/(tabs)');
      } else {
        console.error('Google Login FAILED - Message:', result.message);
        Alert.alert('שגיאת גוגל', result.message || 'התחברות עם גוגל נכשלה');
      }
    } catch (error: any) {
      console.error('CRITICAL: Google Sign-In Error Object:', JSON.stringify(error, null, 2));
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('שגיאת גוגל', 'קרתה שגיאה בתהליך ההתחברות: ' + (error.message || 'Unknown Error'));
      }
    }
    console.log('--- Google Sign-In Process Ended ---');
  };

  return {
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
  };
};
