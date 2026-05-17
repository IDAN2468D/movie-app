import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const isLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasSeenOnboarding = useAuthStore(state => state.hasSeenOnboarding);

  const [animationFinished, setAnimationFinished] = useState(false);
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('Splash mounted. Auth State:', { isLoading, isAuthenticated, hasSeenOnboarding });
    // Start animation
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 }, () => {
      // Guaranteed minimum visible time for the cinematic splash
      setTimeout(() => {
        console.log('Splash animation finished');
        runOnJS(setAnimationFinished)(true);
      }, 2000);
    });
  }, [logoOpacity, logoScale, hasSeenOnboarding, isAuthenticated, isLoading]);

  useEffect(() => {
    if (animationFinished && !isLoading) {
      console.log('--- SEQUENCE START ---');
      console.log('Splash finished, Auth:', isAuthenticated);

      if (isAuthenticated) {
        console.log('Routing: Splash -> Tabs');
        router.replace('/(tabs)');
      } else if (!hasSeenOnboarding) {
        console.log('Routing: Splash -> Onboarding');
        router.replace('/onboarding');
      } else {
        console.log('Routing: Splash -> Login');
        router.replace('/login');
      }
    }
  }, [animationFinished, isLoading, isAuthenticated, hasSeenOnboarding, router]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  return (
    <View className="flex-1 bg-background justify-center items-center">
      <LinearGradient
        colors={[Colors.background, '#1a1a2e', Colors.background]}
        className="absolute inset-0"
      />

      {/* Background glow */}
      <View className="absolute w-72 h-72 rounded-full bg-primary/20 blur-3xl" />

      <Animated.View style={animatedLogoStyle} className="items-center justify-center">
        <View className="w-32 h-32 rounded-[40px] bg-white/5 items-center justify-center border border-white/10 shadow-2xl mb-6 backdrop-blur-xl">
          <Ionicons name="film-outline" size={60} color={Colors.primary} />
        </View>
        <Text className="text-4xl font-display text-white tracking-widest font-bold">
          CineBook
        </Text>
        <Text className="text-white/50 font-display-secondary mt-2 text-lg">
          חוויה קולנועית. מחדש.
        </Text>
      </Animated.View>

      {/* Temporary Debug Button - Remove after testing */}
      <TouchableOpacity
        onPress={async () => {
          await useAuthStore.getState().resetOnboarding();
          console.log('Onboarding RESET from Splash');
          router.replace('/'); // Reload splash
        }}
        className="absolute bottom-10 px-4 py-2 bg-white/5 rounded-full border border-white/10"
      >
        <Text className="text-white/20 text-xs">Reset Onboarding (Debug)</Text>
      </TouchableOpacity>
    </View>
  );
}
