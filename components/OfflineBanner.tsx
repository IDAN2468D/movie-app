import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { WifiOff } from 'lucide-react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Colors } from '@/constants/Theme';

/**
 * Premium glassmorphic Hebrew banner overlay indicating offline mode.
 * Slides down smoothly from the top of the viewport when connection is lost.
 */
export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <Animated.View
      entering={SlideInUp.duration(400)}
      exiting={SlideOutUp.duration(400)}
      style={[styles.container, { paddingTop: insets.top + 6 }]}
    >
      <BlurView intensity={80} tint="dark" style={styles.blur}>
        <View className="flex-row items-center gap-3 px-6 py-4 justify-center" style={{ flexDirection: 'row-reverse' }}>
          <WifiOff size={20} color={Colors.primary} />
          <Text className="text-white text-[13px] font-bold text-center" style={{ fontFamily: 'Rubik-Bold' }}>
            חיבור האינטרנט אבד. האפליקציה פועלת כעת במצב לא מקוון 🔐
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  blur: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
});
