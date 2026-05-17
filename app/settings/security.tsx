import React from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Shield, Fingerprint, KeyRound, Smartphone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/Theme';
import { useAuthStore } from '@/store/useAuthStore';
import { ChangePasswordModal, TwoFactorSetupModal } from '@/components/SecurityModals';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  
  const { 
    biometricsEnabled, 
    setBiometricsEnabled, 
    twoFactorEnabled, 
    setTwoFactorEnabled 
  } = useAuthStore();

  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [twoFactorModalVisible, setTwoFactorModalVisible] = React.useState(false);

  const handleBiometricsToggle = async (value: boolean) => {
    const success = await setBiometricsEnabled(value);
    if (!success && value) {
      Alert.alert('שגיאה', 'לא ניתן להפעיל זיהוי ביומטרי. ודא שהמכשיר תומך ומוגדר כראוי.');
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10 relative">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center z-10">
          <ChevronRight size={24} color={Colors.text} />
        </Pressable>
        <View className="absolute inset-0 justify-center items-center">
          <Text style={[Typography.h2, { fontFamily: 'Rubik-Bold' }]} className="text-white">
            אבטחה ופרטיות
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        <View className="items-center mb-8 mt-4">
          <View className="w-20 h-20 rounded-full bg-blue-500/10 justify-center items-center mb-4">
            <Shield size={40} color="#3B82F6" />
          </View>
          <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 20, color: 'white', textAlign: 'center' }}>אבטחת חשבון</Text>
          <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 }}>
            החשבון שלך מוגן באמצעות טכנולוגיות ההצפנה המתקדמות ביותר.
          </Text>
        </View>

        <View className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden mb-6">
          <View className="flex-row items-center justify-between p-5 border-b border-white/5">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Fingerprint size={20} color={Colors.primary} />
              </View>
              <View className="ms-4 flex-1">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white' }}>זיהוי ביומטרי (FaceID)</Text>
                <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>כניסה מהירה ובטוחה לאפליקציה</Text>
              </View>
            </View>
            <Switch value={biometricsEnabled} onValueChange={handleBiometricsToggle} trackColor={{ false: '#3f3f46', true: Colors.primary }} />
          </View>

          <View className="flex-row items-center justify-between p-5 border-b border-white/5">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-secondary/20 items-center justify-center">
                <Smartphone size={20} color={Colors.secondary} />
              </View>
              <View className="ms-4 flex-1">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white', textAlign: 'left', writingDirection: 'ltr' }}>אימות דו-שלבי</Text>
                <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'left', writingDirection: 'ltr' }}>שכבת הגנה נוספת בעת התחברות</Text>
              </View>
            </View>
            <Switch 
              value={twoFactorEnabled} 
              onValueChange={(value) => {
                if (value) {
                  setTwoFactorModalVisible(true);
                } else {
                  setTwoFactorEnabled(false);
                }
              }} 
              trackColor={{ false: '#3f3f46', true: Colors.secondary }} 
            />
          </View>

          <Pressable 
            onPress={() => setPasswordModalVisible(true)}
            className="flex-row items-center justify-between p-5 active:bg-white/10"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                <KeyRound size={20} color="white" />
              </View>
              <View className="ms-4 flex-1">
                <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 16, color: 'white', textAlign: 'left', writingDirection: 'ltr' }}>החלפת סיסמה</Text>
                <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'left', writingDirection: 'ltr' }}>עדכון סיסמת ההתחברות שלך</Text>
              </View>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.3)" style={{ transform: [{ scaleX: -1 }] }} />
          </Pressable>
        </View>
      </ScrollView>

      <ChangePasswordModal 
        isVisible={passwordModalVisible} 
        onClose={() => setPasswordModalVisible(false)} 
      />
      
      <TwoFactorSetupModal 
        isVisible={twoFactorModalVisible} 
        onClose={() => setTwoFactorModalVisible(false)} 
      />
    </View>
  );
}
