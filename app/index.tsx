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

  // Acoustic shockwave ring
  const soundWaveScale = useSharedValue(0.8);
  const soundWaveOpacity = useSharedValue(0);

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

    // Acoustic shockwave pulse at 250ms (when audio starts)
    const waveTimer = setTimeout(() => {
      soundWaveOpacity.value = withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
      soundWaveScale.value = withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.quad) });
    }, 250);

    const finishSplash = () => {
      setTimeout(() => {
        console.log('Splash animation finished');
        setAnimationFinished(true);
      }, 400);
    };

    // Safety fallback timer: guarantee splash transition after max 1.8s
    const fallbackTimer = setTimeout(() => {
      console.log('Splash fallback safety timer triggered');
      setAnimationFinished(true);
    }, 1800);

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

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(hapticTimer);
      clearTimeout(waveTimer);
    };
  }, []);

  // Ultimate safety timer: force navigation after 2.5 seconds regardless of state
  useEffect(() => {
    const forceNavigateTimer = setTimeout(() => {
      console.log('Splash ultimate force-navigate triggered');
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated) {
        console.log('Force Routing: Splash -> Tabs');
        router.replace('/(tabs)');
      } else if (!authState.hasSeenOnboarding) {
        console.log('Force Routing: Splash -> Onboarding');
        router.replace('/onboarding');
      } else {
        console.log('Force Routing: Splash -> Login');
        router.replace('/login');
      }
    }, 1200);

    return () => clearTimeout(forceNavigateTimer);
  }, []);

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

  const animatedSoundWaveStyle = useAnimatedStyle(() => ({
    opacity: soundWaveOpacity.value,
    transform: [{ scale: soundWaveScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#111122', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* ─── BACKGROUND NEON GLOWS ─── */}
      <Animated.View 
        style={[
          animatedGlow1Style, 
          { 
            position: 'absolute',
            width: 288, 
            height: 288, 
            borderRadius: 144, 
            backgroundColor: 'rgba(255, 20, 100, 0.1)',
            start: -40, 
            top: -40,
          }
        ]} 
      />
      <Animated.View 
        style={[
          animatedGlow2Style, 
          { 
            position: 'absolute',
            width: 320, 
            height: 320, 
            borderRadius: 160, 
            backgroundColor: 'rgba(229, 255, 0, 0.05)',
            end: -40, 
            bottom: -40,
          }
        ]} 
      />

      {/* ─── DUST PARTICLES ─── */}
      {Array.from({ length: 10 }).map((_, i) => (
        <DustParticle key={i} index={i} />
      ))}

      {/* ─── LOGO CONTAINER ─── */}
      <Animated.View testID="splash-logo-container" style={[animatedLogoStyle, styles.logoContainer]}>
        {/* Acoustic Shockwave Ring */}
        <Animated.View
          style={[
            animatedSoundWaveStyle,
            {
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: 70,
              borderWidth: 2,
              borderColor: Colors.primary,
              top: -6,
              alignSelf: 'center',
            }
          ]}
        />

        {/* Glass Card */}
        <View style={styles.glassCard}>
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

        <Text testID="splash-app-title" style={styles.title}>
          CineBook
        </Text>
        
        <Text style={styles.subtitle}>
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
          style={styles.biometricButton}
        >
          <Ionicons name="finger-print-outline" size={22} color={Colors.primary} style={{ marginEnd: 8 }} />
          <Text style={styles.biometricText}>
            התחברות עם זיהוי ביומטרי
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    width: 128,
    height: 128,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Anton-Regular',
    color: '#FFFFFF',
    letterSpacing: 6,
    fontWeight: 'bold',
  },
  subtitle: {
    fontFamily: 'Assistant-Medium',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    fontSize: 18,
  },
  biometricButton: {
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
  },
  biometricText: {
    fontFamily: 'Rubik-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
