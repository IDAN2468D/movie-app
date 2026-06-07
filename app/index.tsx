/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  runOnJS, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  withRepeat, 
  withSequence, 
  withDelay, 
  Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useSplashScreenAudio } from '@/hooks/useSplashScreenAudio';

// ─── DUST PARTICLE SUB-COMPONENT ─────────────────────────────────────────────
function DustParticle({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const startX = (index * 37) % 260 - 130; // spread horizontally
  const startY = (index * 47) % 250 + 80;  // spread vertically from bottom
  const duration = 4000 + (index * 600) % 2500;
  const delay = index * 250;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-startY - 150, { duration, easing: Easing.linear }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: duration * 0.3 }),
          withTiming(0.4, { duration: duration * 0.4 }),
          withTiming(0, { duration: duration * 0.3 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.0, { duration: duration * 0.5 }),
          withTiming(0.4, { duration: duration * 0.5 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 120,
          width: 3 + (index % 3),
          height: 3 + (index % 3),
          borderRadius: 99,
          backgroundColor: '#FFFFFF',
        }
      ]}
    />
  );
}

export default function SplashScreen() {
  useSplashScreenAudio(); // Load and play splash sound (lion roar effect)

  const isLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasSeenOnboarding = useAuthStore(state => state.hasSeenOnboarding);
  const biometricsEnabled = useAuthStore(state => state.biometricsEnabled);
  const authenticateBiometrics = useAuthStore(state => state.authenticateBiometrics);

  const [animationFinished, setAnimationFinished] = useState(false);
  const [biometricAuthenticated, setBiometricAuthenticated] = useState(false);
  const [biometricFailed, setBiometricFailed] = useState(false);
  
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const logoPulse = useSharedValue(1);

  // Background glow blobs
  const glow1Scale = useSharedValue(0.9);
  const glow2Scale = useSharedValue(1.1);

  // Light sweep
  const sweepTranslateX = useSharedValue(-200);

  useEffect(() => {
    console.log('Splash mounted. Auth State:', { isLoading, isAuthenticated, hasSeenOnboarding });
    
    // 1. Initial fade-in of logo
    logoOpacity.value = withTiming(1, { duration: 800 });

    // 2. Continuous ambient glow pulsing
    glow1Scale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glow2Scale.value = withRepeat(
      withTiming(0.9, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // 3. Projector Light sweep sweep
    sweepTranslateX.value = withDelay(
      1100,
      withRepeat(
        withSequence(
          withTiming(320, { duration: 1100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-200, { duration: 0 }),
          withDelay(2200, withTiming(-200, { duration: 0 }))
        ),
        -1,
        false
      )
    );

    const finishSplash = () => {
      setTimeout(() => {
        console.log('Splash animation finished');
        setAnimationFinished(true);
      }, 2000);
    };

    // 4. Spring logo entrance
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 }, (finished) => {
      if (finished) {
        // Switch to heartbeat breathing pulse
        logoPulse.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 750, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        runOnJS(finishSplash)();
      }
    });

    // 5. Sync haptic feedback with sound start (at 250ms)
    const hapticTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 250);

    return () => clearTimeout(hapticTimer);
  }, []);

  useEffect(() => {
    if (animationFinished && !isLoading) {
      console.log('--- SEQUENCE START ---');
      console.log('Splash finished, Auth:', isAuthenticated);

      if (isAuthenticated) {
        if (biometricsEnabled && !biometricAuthenticated) {
          authenticateBiometrics('אימות ביומטרי נדרש לכניסה ל-CineBook').then((success) => {
            if (success) {
              setBiometricAuthenticated(true);
              console.log('Routing: Splash -> Tabs (Biometrics Success)');
              router.replace('/(tabs)');
            } else {
              setBiometricFailed(true);
            }
          });
        } else {
          console.log('Routing: Splash -> Tabs');
          router.replace('/(tabs)');
        }
      } else if (!hasSeenOnboarding) {
        console.log('Routing: Splash -> Onboarding');
        router.replace('/onboarding');
      } else {
        console.log('Routing: Splash -> Login');
        router.replace('/login');
      }
    }
  }, [animationFinished, isLoading, isAuthenticated, hasSeenOnboarding, biometricsEnabled, biometricAuthenticated, router]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value * logoPulse.value }],
    };
  });

  const animatedGlow1Style = useAnimatedStyle(() => ({
    transform: [{ scale: glow1Scale.value }],
  }));

  const animatedGlow2Style = useAnimatedStyle(() => ({
    transform: [{ scale: glow2Scale.value }],
  }));

  const animatedSweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweepTranslateX.value }],
  }));

  return (
    <View className="flex-1 bg-background justify-center items-center overflow-hidden">
      <LinearGradient
        colors={[Colors.background, '#111122', Colors.background]}
        className="absolute inset-0"
      />

      {/* ─── BACKGROUND NEON GLOWS ─── */}
      <Animated.View 
        className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl"
        style={[animatedGlow1Style, { start: -40, top: -40 }]} 
      />
      <Animated.View 
        className="absolute w-80 h-80 rounded-full bg-secondary/5 blur-3xl"
        style={[animatedGlow2Style, { end: -40, bottom: -40 }]} 
      />

      {/* ─── DUST PARTICLES ─── */}
      {Array.from({ length: 10 }).map((_, i) => (
        <DustParticle key={i} index={i} />
      ))}

      {/* ─── LOGO CONTAINER ─── */}
      <Animated.View testID="splash-logo-container" style={animatedLogoStyle} className="items-center justify-center">
        {/* Glass Card */}
        <View className="w-32 h-32 rounded-[40px] bg-white/5 items-center justify-center border border-white/10 shadow-2xl mb-6 backdrop-blur-xl overflow-hidden">
          <Ionicons name="film-outline" size={60} color={Colors.primary} />
          
          {/* Projector Light Sweep Overlay */}
          <Animated.View 
            style={[
              animatedSweepStyle, 
              { 
                position: 'absolute', 
                top: 0, 
                bottom: 0, 
                width: 50, 
                transform: [{ rotate: '25deg' }] 
              }
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.25)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text testID="splash-app-title" className="text-4xl font-display text-white tracking-widest font-bold">
          CineBook
        </Text>
        
        <Text style={{ fontFamily: 'Assistant-Medium', textAlign: 'right', writingDirection: 'rtl' }} className="text-white/50 mt-2 text-lg">
          חוויה קולנועית. מחדש.
        </Text>
      </Animated.View>

      {/* ─── BIOMETRICS BUTTON ─── */}
      {biometricFailed && (
        <TouchableOpacity
          onPress={async () => {
            const success = await authenticateBiometrics('אימות ביומטרי נדרש לכניסה ל-CineBook');
            if (success) {
              setBiometricAuthenticated(true);
              router.replace('/(tabs)');
            }
          }}
          style={{
            position: 'absolute',
            bottom: 110,
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: 'rgba(255, 20, 100, 0.15)',
            borderColor: 'rgba(255, 20, 100, 0.3)',
            borderWidth: 1,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="finger-print-outline" size={22} color={Colors.primary} style={{ marginEnd: 8 }} />
          <Text style={{ fontFamily: 'Rubik-Bold', color: '#FFFFFF', fontSize: 16, textAlign: 'right', writingDirection: 'rtl' }}>
            התחברות עם זיהוי ביומטרי
          </Text>
        </TouchableOpacity>
      )}

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
