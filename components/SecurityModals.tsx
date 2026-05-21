import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, KeyRound, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Colors, Typography } from '@/constants/Theme';
import { useAuthStore } from '@/store/useAuthStore';

interface ChangePasswordModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isVisible, onClose }) => {
  const { changePassword } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('שגיאה', 'יש למלא את כל השדות');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות החדשות אינן תואמות');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);
    const result = await changePassword(oldPassword, newPassword);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('הצלחה', result.message);
      onClose();
      // Clear fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('שגיאה', result.message);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" className="flex-1 justify-center px-6">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View 
            entering={ZoomIn.duration(400)}
            className="bg-surface border border-white/10 rounded-[32px] overflow-hidden"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-white/5">
              <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                <X color="white" size={20} />
              </Pressable>
              <Text style={[Typography.h3, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-white">החלפת סיסמה</Text>
              <View className="w-10" />
            </View>

            <View className="p-6 gap-5">
              <View className="items-center mb-2">
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-2">
                  <KeyRound size={32} color={Colors.primary} />
                </View>
                <Text style={[Typography.h2, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-white mb-2">אבטחת חשבון</Text>
                <Text style={[Typography.body, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-textSecondary">
                  הזן את הסיסמה הנוכחית שלך ולאחריה את הסיסמה החדשה.
                </Text>
              </View>

              {/* Old Password */}
              <View>
                <Text style={[Typography.label, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-textSecondary mb-2 me-2">סיסמה נוכחית</Text>
                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-14">
                  <Lock size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showOld}
                    placeholder="סיסמה ישנה"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className="flex-1 text-white px-3 font-display"
                    style={{ textAlign: oldPassword ? 'left' : 'right', writingDirection: oldPassword ? 'ltr' : 'rtl' }}
                  />
                  <Pressable onPress={() => setShowOld(!showOld)}>
                    {showOld ? <EyeOff size={18} color="white" /> : <Eye size={18} color="white" />}
                  </Pressable>
                </View>
              </View>

              {/* New Password */}
              <View>
                <Text style={[Typography.label, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-textSecondary mb-2 me-2">סיסמה חדשה</Text>
                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-14">
                  <Lock size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="6 תווים לפחות"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className="flex-1 text-white px-3 font-display"
                    style={{ textAlign: newPassword ? 'left' : 'right', writingDirection: newPassword ? 'ltr' : 'rtl' }}
                  />
                  <Pressable onPress={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff size={18} color="white" /> : <Eye size={18} color="white" />}
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View>
                <Text style={[Typography.label, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-textSecondary mb-2 me-2">אימות סיסמה</Text>
                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 h-14">
                  <Lock size={18} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showNew}
                    placeholder="הזן שוב את הסיסמה"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    className="flex-1 text-white px-3 font-display"
                    style={{ textAlign: confirmPassword ? 'left' : 'right', writingDirection: confirmPassword ? 'ltr' : 'rtl' }}
                  />
                </View>
              </View>

              <Pressable 
                onPress={handleSave}
                disabled={loading}
                className="bg-primary h-14 rounded-2xl items-center justify-center mt-4 shadow-lg" style={{ shadowColor: Colors.primary, shadowOpacity: 0.2 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={[Typography.h3, { textAlign: 'center', writingDirection: 'ltr' }]} className="text-white">עדכן סיסמה</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

interface TwoFactorSetupModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({ isVisible, onClose }) => {
  const { setTwoFactorEnabled } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    // Simulate setup process
    await new Promise(resolve => setTimeout(resolve, 2000));
    await setTwoFactorEnabled(true);
    setLoading(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('הצלחה', 'אימות דו-שלבי הופעל בהצלחה בחשבונך.');
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" className="flex-1 justify-center px-6">
        <Animated.View 
          entering={FadeInDown.springify()}
          className="bg-surface border border-white/10 rounded-[32px] overflow-hidden"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-white/5">
            <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
              <X color="white" size={20} />
            </Pressable>
            <Text style={[Typography.h3, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-white">אבטחה דו-שלבית</Text>
            <View className="w-10" />
          </View>

          <View className="p-8 gap-6 items-center">
            <View className="w-20 h-20 rounded-full bg-secondary/10 items-center justify-center">
              <ShieldCheck size={40} color={Colors.secondary} />
            </View>
            
            <View className="w-full">
              <Text style={[Typography.h2, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-white mb-2">הגנה כפולה על החשבון</Text>
              <Text style={[Typography.body, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-textSecondary">
                אימות דו-שלבי מוסיף שכבת הגנה נוספת. בכל פעם שתתחבר ממכשיר חדש, נבקש ממך קוד אימות שיישלח לטלפון שלך.
              </Text>
            </View>

            <View className="w-full bg-white/5 p-4 rounded-2xl border border-white/5">
              <View className="flex-row items-center mb-3">
                <View className="w-2 h-2 rounded-full bg-secondary me-3" />
                <Text style={[Typography.caption, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-white flex-1">מניעת גישה לא מורשית גם אם הסיסמה שלך נגנבה.</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-secondary me-3" />
                <Text style={[Typography.caption, { textAlign: 'left', writingDirection: 'ltr' }]} className="text-white flex-1">התראות בזמן אמת על ניסיונות התחברות חשודים.</Text>
              </View>
            </View>

            <Pressable 
              onPress={handleEnable}
              disabled={loading}
              className="bg-secondary w-full h-14 rounded-2xl items-center justify-center shadow-lg" style={{ shadowColor: Colors.secondary, shadowOpacity: 0.1 }}
            >
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={[Typography.h3, { color: 'black', textAlign: 'center', writingDirection: 'ltr' }]}>הפעל שירות</Text>
              )}
            </Pressable>
            
            <Pressable onPress={onClose}>
              <Text style={[Typography.caption, { textAlign: 'center', writingDirection: 'ltr' }]} className="text-textMuted">אולי מאוחר יותר</Text>
            </Pressable>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};
