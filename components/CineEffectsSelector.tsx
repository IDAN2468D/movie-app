import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Sparkles, Droplet, Smartphone, Star, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useCineEffectsStore, CineEffectMode } from '@/store/useCineEffectsStore';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface CineEffectsSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function CineEffectsSelector({ visible, onClose }: CineEffectsSelectorProps) {
  const insets = useSafeAreaInsets();
  const { currentEffect, setEffect } = useCineEffectsStore();

  const handleSelectEffect = (mode: CineEffectMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEffect(mode);
  };

  const effectOptions = [
    {
      id: 'glow' as CineEffectMode,
      title: 'זוהר סרטים דינמי',
      subtitle: 'הצבעים משתנים אוטומטית לפי ז\'אנר הסרט המוצג',
      icon: Sparkles,
      color: Colors.primary,
    },
    {
      id: 'liquid' as CineEffectMode,
      title: 'רקע נוזלי בתנועה',
      subtitle: 'בועות צבעוניות זורמות בצורה אורגנית ברקע',
      icon: Droplet,
      color: '#4A00E0',
    },
    {
      id: 'gyro' as CineEffectMode,
      title: 'מרחב ג\'ירוסקופי 3D',
      subtitle: 'הרקע והאלמנטים זזים בתלת-ממד בהטיית המכשיר',
      icon: Smartphone,
      color: Colors.secondary,
    },
    {
      id: 'plasma' as CineEffectMode,
      title: 'חלקיקי פלזמה זוהרים',
      subtitle: 'נקודות אור זוהרות המרחפות בעדינות בחשכת האולם',
      icon: Star,
      color: '#FFB84B',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Click outside to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Container */}
        <Animated.View
          entering={FadeInDown.springify().damping(20).stiffness(120)}
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom + 20, 40),
            },
          ]}
          className="bg-surface/95 border-t border-white/10"
        >
          {/* Glass blur background for the drawer sheet */}
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Handle bar */}
          <View style={styles.handle} className="bg-white/20" />

          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-4 pb-2" style={{ flexDirection: 'row-reverse' }}>
            <View className="items-end">
              <Text className="text-white text-xl font-bold font-assistant text-right">אפקטים קולנועיים</Text>
              <Text className="text-textSecondary text-xs font-assistant mt-1 text-right">
                בחר את סגנון הרקע והאווירה של מסך הבית
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center"
              style={({ pressed }) => [pressed && { scale: 0.9, opacity: 0.8 }]}
            >
              <X size={16} color="white" />
            </Pressable>
          </View>

          {/* List of effect options */}
          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
            {effectOptions.map((option, index) => {
              const IconComp = option.icon;
              const isActive = currentEffect === option.id;

              return (
                <Animated.View
                  key={option.id}
                  entering={FadeInUp.delay(index * 60).springify().damping(18)}
                >
                  <Pressable
                    onPress={() => handleSelectEffect(option.id)}
                    className="mb-4 rounded-2xl overflow-hidden border p-4 flex-row items-center justify-between"
                    style={[
                      isActive
                        ? {
                            backgroundColor: 'rgba(255, 20, 100, 0.06)',
                            borderColor: 'rgba(255, 20, 100, 0.25)',
                          }
                        : {
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                          },
                    ]}
                  >
                    {/* Checkmark indicator (Left aligned) */}
                    <View className="w-6 h-6 rounded-full items-center justify-center">
                      {isActive && (
                        <View
                          className="w-5 h-5 rounded-full items-center justify-center bg-primary"
                          style={{
                            shadowColor: Colors.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.4,
                            shadowRadius: 4,
                          }}
                        >
                          <Check size={12} color="white" strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    {/* Option Details (Right aligned, text flow RTL) */}
                    <View className="flex-1 px-4 items-end">
                      <Text
                        className="text-white text-[15px] font-semibold text-right"
                        style={{ fontFamily: 'Rubik-Medium' }}
                      >
                        {option.title}
                      </Text>
                      <Text
                        className="text-textSecondary text-[12px] mt-1 text-right"
                        style={{ fontFamily: 'Assistant-Regular' }}
                      >
                        {option.subtitle}
                      </Text>
                    </View>

                    {/* Icon block (Right aligned) */}
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center border border-white/10"
                      style={{ backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <IconComp size={20} color={isActive ? option.color : 'rgba(255,255,255,0.6)'} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '75%',
    borderTopStartRadius: 32,
    borderTopEndRadius: 32,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
});
