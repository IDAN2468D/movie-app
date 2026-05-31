import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useUserStore, selectUser, selectUpdateAvatar, selectUpdateProfile } from '../../store/useUserStore';
import { pickImage, uploadAvatar, updateProfile, profileUpdateSchema } from '../../services/profileService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Camera } from 'lucide-react-native';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  
  // Top level hooks & Atomic selectors
  const user = useUserStore(selectUser);
  const updateAvatarInStore = useUserStore(selectUpdateAvatar);
  const updateProfileInStore = useUserStore(selectUpdateProfile);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animation values
  const buttonScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const onPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const onPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const handleAvatarUpload = async () => {
    try {
      const asset = await pickImage();
      if (!asset) return;

      setIsUploading(true);
      const newAvatarUrl = await uploadAvatar(asset.uri);
      updateAvatarInStore(newAvatarUrl);
      Alert.alert('הצלחה', 'תמונת הפרופיל עודכנה בהצלחה');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'שגיאה בעדכון התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setErrors({});
    const result = profileUpdateSchema.safeParse({ displayName, email, password });
    
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          formattedErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile(result.data);
      updateProfileInStore(result.data.displayName, result.data.email);
      Alert.alert('הצלחה', 'הפרופיל עודכן בהצלחה');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
        
        <View style={styles.header}>
          <Text style={styles.title}>עריכת פרופיל</Text>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarUpload} disabled={isUploading} style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{displayName.charAt(0) || 'U'}</Text>
              </View>
            )}
            
            <View style={styles.cameraIconContainer}>
              <Camera color="#FFF" size={20} />
            </View>

            {isUploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#E50914" size="large" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>שם תצוגה</Text>
            <TextInput
              style={[styles.input, errors.displayName && styles.inputError]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="הכנס שם תצוגה"
              placeholderTextColor="rgba(255,255,255,0.5)"
              textAlign="right"
            />
            {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>אימייל</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="הכנס אימייל"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>סיסמה חדשה (אופציונלי)</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              placeholder="הכנס סיסמה חדשה"
              placeholderTextColor="rgba(255,255,255,0.5)"
              secureTextEntry
              textAlign="right"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity 
              onPressIn={onPressIn} 
              onPressOut={onPressOut} 
              onPress={handleSaveProfile} 
              disabled={isSaving}
              activeOpacity={1}
            >
              <LinearGradient 
                colors={['#E50914', '#9B1B30']} 
                style={styles.saveButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>שמור שינויים</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingStart: 24,
    paddingEnd: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    writingDirection: 'rtl',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', // Liquid glass fallback
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFF',
    fontSize: 48,
    fontFamily: 'Rubik-Medium',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)', // Liquid glass surface
    borderRadius: 24,
    paddingStart: 24,
    paddingEnd: 24,
    paddingTop: 24,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Assistant-SemiBold',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingStart: 16,
    paddingEnd: 16,
    paddingTop: 14,
    paddingBottom: 14,
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Assistant-Regular',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputError: {
    borderColor: '#E50914',
  },
  errorText: {
    color: '#E50914',
    fontSize: 12,
    fontFamily: 'Assistant-Regular',
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  saveButton: {
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Rubik-Medium',
  },
});
