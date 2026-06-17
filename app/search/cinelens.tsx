import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Image, ActivityIndicator, I18nManager, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, Zap, ZapOff, Aperture, ArrowLeft, ArrowRight, BookOpen, Star, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Theme';
import { API_BASE_URL } from '../../constants/Config';
import { safeFetch } from '../../store/apiHelper';
import { useAuthStore } from '../../store/useAuthStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, withRepeat, withSequence, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface LensAnalysis {
  movieTitle: string;
  directorInfo: string;
  cinematographyStyle: string;
  deepTrivia: string[];
}

export default function CineLensScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LensAnalysis | null>(null);

  // Scanning laser animation
  const laserY = useSharedValue(0.2 * height);

  useEffect(() => {
    if (isScanning) {
      laserY.value = withRepeat(
        withSequence(
          withTiming(0.6 * height, { duration: 1500 }),
          withTiming(0.2 * height, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [isScanning]);

  const laserStyle = useAnimatedStyle(() => ({
    top: laserY.value,
    opacity: isScanning ? 1 : 0,
  }));

  const handleCaptureAndAnalyze = async () => {
    if (!cameraRef.current || isScanning) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsScanning(true);
    setAnalysisResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      if (photo?.base64) {
        const token = useAuthStore.getState().token;
        const response = await safeFetch(`${API_BASE_URL}/mcp/analyze-poster`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            image: photo.base64,
          }),
        });

        if (response.success && response.data?.analysis) {
          setAnalysisResult(response.data.analysis);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error('[CineLens] Capture failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsScanning(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background px-8 justify-center items-center">
        <BlurView intensity={40} tint="dark" className="w-full p-8 rounded-3xl border border-white/10 items-center">
          <Text className="text-white text-2xl font-bold mb-4" style={{ fontFamily: 'Rubik-Bold' }}>דרושה גישה למצלמה</Text>
          <Text className="text-white/60 mb-6 text-center" style={{ fontFamily: 'Assistant-Regular' }}>
            כדי לסרוק פוסטרים ולגלות עליהם מידע מעמיק באמצעות AI, יש לאשר גישה למצלמת המכשיר.
          </Text>
          <Pressable onPress={requestPermission} className="bg-primary py-4 px-8 rounded-xl w-full items-center">
            <Text className="text-white font-bold">אשר גישה למצלמה</Text>
          </Pressable>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash}
      />

      {/* AR Focus Frame overlay */}
      {!analysisResult && (
        <View style={styles.overlayFrame} className="justify-center items-center">
          <View className="w-64 h-80 border-2 border-white/20 rounded-[32px] relative justify-center items-center">
            <View className="absolute top-2 w-12 h-1 bg-white/20 rounded-full" />
            <Text className="text-white/60 text-xs text-center px-4" style={{ fontFamily: 'Assistant-Regular' }}>
              מקם את הפוסטר כאן ולחץ על כפתור הצילום
            </Text>
          </View>
        </View>
      )}

      {/* Laser scan animation line */}
      <Animated.View style={[styles.laserLine, laserStyle]} />

      {/* Floating Header */}
      <View 
        className="absolute w-full px-6 flex-row justify-between items-center z-30"
        style={{ top: insets.top + 10 }}
      >
        <Pressable 
          onPress={() => router.back()} 
          className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 justify-center items-center active:scale-95"
        >
          {I18nManager.isRTL ? <ChevronRight size={24} color="white" /> : <ChevronLeft size={24} color="white" />}
        </Pressable>
        <View className="bg-black/40 border border-white/10 px-4 py-2 rounded-2xl flex-row items-center gap-2">
          <Sparkles size={16} color={Colors.secondary} />
          <Text className="text-white font-bold" style={{ fontFamily: 'Rubik-Medium' }}>CineLens AI סורק</Text>
        </View>
        <Pressable 
          onPress={() => setFlash(f => !f)} 
          className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 justify-center items-center active:scale-95"
        >
          {flash ? <Zap size={22} color={Colors.secondary} /> : <ZapOff size={22} color="white" />}
        </Pressable>
      </View>

      {/* Shutter Shutter Trigger Button (Bottom Screen) */}
      {!analysisResult && (
        <View className="absolute bottom-12 w-full items-center z-30">
          <Pressable 
            onPress={handleCaptureAndAnalyze}
            disabled={isScanning}
            className="w-20 h-20 rounded-full bg-black/30 border-2 border-white/30 items-center justify-center p-2"
          >
            <View className="w-full h-full rounded-full bg-primary items-center justify-center">
              {isScanning ? <ActivityIndicator size="small" color="white" /> : <Aperture size={30} color="white" />}
            </View>
          </Pressable>
        </View>
      )}

      {/* Analysis Result Card Overlay */}
      {analysisResult && (
        <Animated.View 
          entering={FadeInDown.springify()} 
          className="absolute bottom-0 left-0 right-0 max-h-[70%] bg-surfaceGlass/40 border-t border-white/10 rounded-t-[32px] overflow-hidden"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <BlurView intensity={45} tint="dark" className="absolute inset-0" />
          
          {/* Draggable indicator line */}
          <View className="w-12 h-1.5 bg-white/20 rounded-full align-self-center my-3 self-center" />

          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            {/* Movie Title */}
            <View className="flex-row items-center justify-between mb-4 mt-2">
              <Text className="text-white text-2xl font-bold text-left" style={{ fontFamily: 'Rubik-Bold' }}>
                {analysisResult.movieTitle}
              </Text>
              <Pressable 
                onPress={() => setAnalysisResult(null)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <X size={16} color="white" />
              </Pressable>
            </View>

            {/* Director Information */}
            <View className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-4">
              <Text className="text-primary text-xs font-bold text-right mb-1" style={{ fontFamily: 'Rubik-Medium' }}>במאי / יוצר</Text>
              <Text className="text-white text-base text-right" style={{ fontFamily: 'Assistant-SemiBold' }}>{analysisResult.directorInfo}</Text>
            </View>

            {/* Cinematography Style */}
            <View className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-4">
              <Text className="text-secondary text-xs font-bold text-right mb-1" style={{ fontFamily: 'Rubik-Medium' }}>סגנון צילום חזותי</Text>
              <Text className="text-white text-sm text-right leading-relaxed" style={{ fontFamily: 'Assistant-Regular' }}>{analysisResult.cinematographyStyle}</Text>
            </View>

            {/* Deep Trivia List */}
            <View className="mb-6">
              <Text className="text-white/60 text-xs font-bold text-right mb-3" style={{ fontFamily: 'Rubik-Medium' }}>טריוויה וסודות קולנועיים</Text>
              {analysisResult.deepTrivia.map((trivia, index) => (
                <View key={index} className="flex-row gap-3 mb-3 justify-end items-start">
                  <Text className="text-white text-sm text-right flex-1 leading-relaxed" style={{ fontFamily: 'Assistant-Regular' }}>{trivia}</Text>
                  <View className="w-2 h-2 rounded-full bg-primary mt-2" />
                </View>
              ))}
            </View>

            {/* Quick Action Button */}
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // In production, navigate to matching movie details screen
                router.back();
              }}
              className="bg-primary w-full py-4 rounded-xl items-center shadow-lg mb-6"
            >
              <Text className="text-white font-bold" style={{ fontFamily: 'Rubik-Bold' }}>חזור להזמנת כרטיסים</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlayFrame: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF1464',
    shadowColor: '#FF1464',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 20,
  },
});
