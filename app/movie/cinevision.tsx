import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Dimensions, I18nManager, ActivityIndicator, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Zap, ZapOff, Camera, Aperture, CheckCircle2, Download, RefreshCw, CloudLightning } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useCineVisionStore } from '@/store/useCineVisionStore';
import { useStampStore } from '@/store/useStampStore';
import { GoogleDriveService } from '@/services/GoogleDriveService';

// Safe dynamic require for Expo native module fallback
let MediaLibrary: any = null;
try {
  MediaLibrary = require('expo-media-library');
} catch (e) {
  console.warn('Expo Media Library native module not available');
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spring preset for natural, premium physics (from 002-CINEBOOK-RULES.md)
const SpringPresets = {
  organic: {
    damping: 15,
    stiffness: 120,
    mass: 1.0,
  },
  snappy: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  }
};

export default function CineVisionScreen() {
  const insets = useSafeAreaInsets();
  const { movieId, movieTitle, backdropPath, scannedPhotoUri, autoMint } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    backdropPath: string;
    scannedPhotoUri?: string;
    autoMint?: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  // Gallery saving states
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Google Drive saving states
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSaveSuccess, setDriveSaveSuccess] = useState(false);

  // Zustand state stores
  const scanState = useCineVisionStore(state => state.scanState);
  const setScanState = useCineVisionStore(state => state.setScanState);
  const flashMode = useCineVisionStore(state => state.flashMode);
  const setFlashMode = useCineVisionStore(state => state.setFlashMode);
  const capturedImage = useCineVisionStore(state => state.capturedImage);
  const setCapturedImage = useCineVisionStore(state => state.setCapturedImage);
  const resetCineVision = useCineVisionStore(state => state.reset);
  const addStamp = useStampStore(state => state.addStamp);

  // Shared Animation Values
  const uiOpacity = useSharedValue(1);
  const targetPulse = useSharedValue(1);
  const scanLineY = useSharedValue(0);
  const stampScale = useSharedValue(1);
  const stampTranslateY = useSharedValue(0);
  const stampFloatY = useSharedValue(0);
  const stampRotate = useSharedValue(0);
  const ambientGlowOpacity = useSharedValue(0);
  const successUIPosition = useSharedValue(100);

  // Handle auto-minting redirect from home page poster scanner
  useEffect(() => {
    if (autoMint === 'true' && scannedPhotoUri) {
      setCapturedImage(scannedPhotoUri);
      setScanState('processing');
      uiOpacity.value = withTiming(0, { duration: 100 });
      stampScale.value = withSpring(0.72, SpringPresets.organic);
      stampTranslateY.value = withSpring(-50, SpringPresets.organic);
      ambientGlowOpacity.value = withTiming(1, { duration: 1200 });

      const newStamp = {
        id: Math.random().toString(36).substring(2, 9),
        movieId: movieId || 'custom',
        movieTitle: movieTitle || 'סרט כללי',
        stampImage: scannedPhotoUri,
        timestamp: Date.now(),
      };

      const timer1 = setTimeout(() => {
        addStamp(newStamp);
        setScanState('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        successUIPosition.value = withSpring(0, SpringPresets.organic);
      }, 1500);

      return () => clearTimeout(timer1);
    }
  }, [autoMint, scannedPhotoUri]);

  // Initialize permission check
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Viewfinder animations
  useEffect(() => {
    targetPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200 }),
        withTiming(0.96, { duration: 1200 })
      ),
      -1,
      true
    );

    scanLineY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      true
    );

    stampFloatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500 }),
        withTiming(6, { duration: 1500 })
      ),
      -1,
      true
    );

    stampRotate.value = withRepeat(
      withSequence(
        withTiming(0.04, { duration: 2000 }),
        withTiming(-0.04, { duration: 2000 })
      ),
      -1,
      true
    );

    return () => {
      resetCineVision();
    };
  }, []);

  // Reanimated Styles (Hooks at top-level)
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: targetPulse.value }],
    opacity: withTiming(scanState === 'idle' ? 1 : 0, { duration: 200 })
  }));

  const scanLineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value * (SCREEN_WIDTH * 0.9) }],
    opacity: withTiming(scanState === 'idle' ? 1 : 0, { duration: 200 })
  }));

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
    transform: [{ translateY: withTiming(uiOpacity.value === 1 ? 0 : 20, { duration: 200 }) }]
  }));

  const stampAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: stampScale.value },
      { translateY: stampTranslateY.value + stampFloatY.value },
      { rotateZ: `${stampRotate.value}rad` }
    ]
  }));

  const ambientGlowStyle = useAnimatedStyle(() => ({
    opacity: ambientGlowOpacity.value
  }));

  const successUIStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: successUIPosition.value }],
    opacity: withTiming(scanState === 'success' ? 1 : 0, { duration: 300 })
  }));

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Text className="text-white text-lg font-medium animate-pulse" style={{ fontFamily: 'Assistant-Medium' }}>
          טוען עדשת סריקה...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer} className="bg-background px-8 justify-center items-center">
        <BlurView 
          intensity={40} 
          tint="dark" 
          className="w-full p-8 rounded-[24px] border border-white/10 items-center bg-black/40 shadow-2xl"
        >
          <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-6">
            <Camera color={Colors.primary} size={36} />
          </View>
          <Text className="text-white font-bold text-2xl mb-3 text-center" style={{ fontFamily: 'Rubik-Bold' }}>
            דרושה גישה למצלמה
          </Text>
          <Text className="text-white/70 font-medium mb-8 text-sm leading-relaxed text-center" style={{ fontFamily: 'Assistant-Regular' }}>
            כדי לזהות כרזות סרטים ברחוב ולהטביע בולים דיגיטליים מיוחדים, עלינו להפעיל את מצלמת המכשיר.
          </Text>
          <Pressable 
            className="bg-primary py-4 rounded-xl w-full items-center active:scale-95"
            onPress={requestPermission}
          >
            <Text className="text-white font-bold text-base" style={{ fontFamily: 'Rubik-Medium' }}>
              אשר גישה למצלמה
            </Text>
          </Pressable>
        </BlurView>
      </View>
    );
  }

  const handleCapture = async () => {
    if (scanState !== 'idle') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanState('scanning');

    try {
      let photoUri = '';
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        photoUri = photo?.uri || '';
      }

      // If in simulator or camera output empty, fallback to the TMDB backdrop image path
      const stampImage = photoUri || (backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : 'https://picsum.photos/600/800');
      setCapturedImage(stampImage);

      // Start transformation flow
      setScanState('processing');
      uiOpacity.value = withTiming(0, { duration: 200 });

      // Run morph animations - Scaled up to a larger 0.72 scale for maximum presence
      stampScale.value = withSpring(0.72, SpringPresets.organic);
      stampTranslateY.value = withSpring(-50, SpringPresets.organic);
      ambientGlowOpacity.value = withTiming(1, { duration: 1200 });

      // Mint and store Stamp in user collection
      const newStamp = {
        id: Math.random().toString(36).substring(2, 9),
        movieId: movieId || 'custom',
        movieTitle: movieTitle || 'סרט כללי',
        stampImage,
        timestamp: Date.now(),
      };

      setTimeout(() => {
        addStamp(newStamp);
        setScanState('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        successUIPosition.value = withSpring(0, SpringPresets.organic);
      }, 1500);

    } catch (error) {
      console.error('Failed to capture poster:', error);
      setScanState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      uiOpacity.value = withTiming(1, { duration: 200 });
    }
  };

  const handleSaveToGallery = async () => {
    if (!capturedImage) return;
    setIsSavingImage(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      let fileUriToSave = capturedImage;

      // If remote TMDB URL, download locally first
      if (capturedImage.startsWith('http')) {
        const localFilename = `stamp_${Date.now()}.jpg`;
        const localDest = `${FileSystem.documentDirectory}${localFilename}`;
        const downloadResult = await FileSystem.downloadAsync(capturedImage, localDest);
        fileUriToSave = downloadResult.uri;
      }

      // 1. Android Storage Access Framework (SAF) fallback for Expo Go compatibility
      if (FileSystem.StorageAccessFramework) {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const directoryUri = permissions.directoryUri;
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              directoryUri,
              `CineStamp_${Date.now()}`,
              'image/jpeg'
            );
            const base64Data = await FileSystem.readAsStringAsync(fileUriToSave, { encoding: 'base64' });
            await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: 'base64' });
            
            setSaveSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setSaveSuccess(false), 3000);
            setIsSavingImage(false);
            return;
          }
        } catch (safError) {
          console.warn('SAF download failed, trying standard media library:', safError);
        }
      }

      // 2. iOS or linked Android custom client: direct MediaLibrary save
      if (MediaLibrary) {
        let permissionResult = await MediaLibrary.getPermissionsAsync();
        if (permissionResult.status !== 'granted') {
          permissionResult = await MediaLibrary.requestPermissionsAsync();
        }

        if (permissionResult.status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(fileUriToSave);
          setSaveSuccess(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => setSaveSuccess(false), 3000);
          setIsSavingImage(false);
          return;
        }
      }

      // 3. Absolute Fallback: System share sheet dialog
      await Share.share({
        url: fileUriToSave,
        title: 'שמור בול סרט',
      });
      setSaveSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Gallery saving failed:', error);
      alert('אירעה שגיאה בעת שמירת הבול לגלריה');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!capturedImage) return;
    setIsSavingToDrive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const res = await GoogleDriveService.uploadStampToDrive(capturedImage, movieTitle || 'סרט כללי');
      if (res.success) {
        setDriveSaveSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setDriveSaveSuccess(false), 3000);
      } else {
        alert(res.message || 'שגיאה בשמירת הקובץ לגוגל דרייב');
      }
    } catch (error) {
      console.error('Google Drive saving failed:', error);
      alert('שגיאת שמירה לדרייב');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (autoMint === 'true' && movieId && movieId !== 'custom') {
      router.replace(`/movie/${movieId}`);
    } else {
      router.back();
    }
  };

  const handleReset = () => {
    resetCineVision();
    uiOpacity.value = withTiming(1, { duration: 200 });
    stampScale.value = withTiming(1, { duration: 300 });
    stampTranslateY.value = withTiming(0, { duration: 300 });
    ambientGlowOpacity.value = withTiming(0, { duration: 300 });
    successUIPosition.value = withTiming(100, { duration: 300 });
  };

  // Generate perforated holes layout
  const renderPerforations = (count: number, position: 'top' | 'bottom' | 'left' | 'right') => {
    const list = Array.from({ length: count });
    const isHorizontal = position === 'top' || position === 'bottom';
    
    return (
      <View 
        style={[
          styles.perforationLine,
          isHorizontal ? styles.perforationRow : styles.perforationCol,
          position === 'top' && { top: -7 },
          position === 'bottom' && { bottom: -7 },
          position === 'left' && { left: -7 },
          position === 'right' && { right: -7 },
        ]}
      >
        {list.map((_, i) => (
          <View key={i} style={styles.perforationHole} />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {scanState === 'idle' || scanState === 'scanning' ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flashMode === 'on'}
        />
      ) : (
        <View style={StyleSheet.absoluteFill} className="bg-black" />
      )}

      {/* Ambient Glow layer matching the Liquid Glass spec */}
      <Animated.View 
        style={[StyleSheet.absoluteFill, ambientGlowStyle]} 
        pointerEvents="none"
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View 
          className="absolute w-96 h-96 rounded-full bg-primary/30" 
          style={{ top: SCREEN_HEIGHT / 2 - 250, left: SCREEN_WIDTH / 2 - 192, filter: 'blur(100px)' }}
        />
      </Animated.View>

      {/* Top Header Overlay */}
      <Animated.View 
        className="absolute top-0 w-full z-20 px-6 pb-6 pt-4"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-h2 font-bold text-center w-full" style={{ fontFamily: 'Rubik-Bold' }}>
            CineVision
          </Text>
        </View>
        <Text className="text-white/80 text-sm mt-2 text-center" style={{ fontFamily: 'Assistant-Regular' }}>
          מקד את המצלמה אל כרזת הסרט לסריקה מהירה
        </Text>
      </Animated.View>

      {/* Redesigned Camera Viewfinder (Neon Laser & Glass Mask) */}
      {scanState === 'idle' && (
        <View style={styles.viewfinderWrapper}>
          {/* Glass blur masks for cropping visual effect */}
          <BlurView intensity={25} tint="dark" className="absolute top-0 inset-x-0 bottom-[60%]" />
          <BlurView intensity={25} tint="dark" className="absolute bottom-0 inset-x-0 top-[60%]" />
          <BlurView intensity={25} tint="dark" className="absolute top-[40%] bottom-[40%] left-0 right-[82.5%]" />
          <BlurView intensity={25} tint="dark" className="absolute top-[40%] bottom-[40%] right-0 left-[82.5%]" />

          <View style={styles.targetWrapper} pointerEvents="none">
            <Animated.View style={[styles.targetBox, pulseAnimatedStyle]}>
              {/* 4 Neon Lime Green Glowing Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Animated Neon Laser Scanline */}
              <Animated.View style={[styles.laserScanline, scanLineAnimatedStyle]} />
            </Animated.View>
          </View>
        </View>
      )}

      {/* Perforated Stamp Morph Panel */}
      {(scanState === 'processing' || scanState === 'success') && capturedImage && (
        <View style={styles.stampCanvas} pointerEvents="none">
          <Animated.View 
            style={[styles.stampCard, stampAnimatedStyle]} 
            className="border-[3px] border-[#e2e8f0] shadow-2xl"
          >
            {/* Silver Foil Backing */}
            <View style={StyleSheet.absoluteFill} className="bg-slate-200 rounded-[8px]" />

            {/* The Poster Background (Full bleed) */}
            <View style={StyleSheet.absoluteFill} className="rounded-[8px] overflow-hidden m-1 bg-black">
              <Image 
                source={{ uri: capturedImage }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              {/* Top Vignette for text readability */}
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                style={{ height: 100, width: '100%' }}
              />
              {/* Bottom Vignette */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={{ position: 'absolute', bottom: 0, height: 120, width: '100%' }}
              />
            </View>

            {/* Specular Gloss Overlay - Now restricted inside the poster area */}
            <View style={StyleSheet.absoluteFill} className="rounded-[8px] overflow-hidden m-1" pointerEvents="none">
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { transform: [{ rotate: '45deg' }, { scale: 1.5 }] }]}
              />
            </View>

            {/* Inner Content Wrapper */}
            <View style={StyleSheet.absoluteFill} className="p-3 justify-between">
              
              {/* Top Section */}
              <View className="flex-row justify-between items-start mt-1">
                <Text className="text-white text-4xl font-bold tracking-widest shadow-lg" style={{ fontFamily: 'Rubik-Bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10 }}>
                  ישראל
                </Text>
                <View className="bg-primary/90 px-3 py-1 rounded-full border border-white/30 shadow-lg">
                  <Text className="text-white text-[10px] font-bold tracking-widest uppercase">
                    CineStamp™
                  </Text>
                </View>
              </View>

              {/* Bottom Glass Panel Section */}
              <BlurView intensity={50} tint="dark" className="w-full rounded-xl overflow-hidden border border-white/20 p-3 shadow-2xl mb-1">
                <Text className="text-white text-lg font-bold mb-1" style={{ fontFamily: 'Assistant-Bold', textAlign: 'left' }} numberOfLines={1}>
                  {movieTitle || 'סרט כללי'}
                </Text>
                
                <View className="flex-row justify-between items-end mt-2">
                  <View>
                    <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ textAlign: 'left' }}>
                      ערך נקוב
                    </Text>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline' }}>
                      <Text className="text-[#D4FF00] text-3xl font-bold" style={{ fontFamily: 'Assistant-Bold' }}>
                        4.20
                      </Text>
                      <Text className="text-white/80 text-sm font-bold marginStart-1">
                        ₪
                      </Text>
                    </View>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-white/50 text-[8px] tracking-widest font-bold mb-1.5">
                      EDITION 2026
                    </Text>
                    <Text className="text-white text-sm font-bold opacity-90" style={{ fontFamily: 'Assistant-Bold' }}>
                      اسرائيل • ISRAEL
                    </Text>
                  </View>
                </View>
              </BlurView>

            </View>

            {/* Stamp Perforation Circles placed OVER the card boundaries for true zigzag edges */}
            {renderPerforations(15, 'top')}
            {renderPerforations(15, 'bottom')}
            {renderPerforations(21, 'left')}
            {renderPerforations(21, 'right')}
          </Animated.View>
        </View>
      )}

      {/* Floating Bottom Dashboard (Scan Controls) */}
      <Animated.View 
        style={[
          styles.bottomBar,
          { bottom: Math.max(insets.bottom + 20, 40) },
          controlsAnimatedStyle
        ]}
      >
        {/* Left Side: Close Button */}
        <Pressable 
          onPress={handleClose}
          className="flex-row items-center justify-center px-4 rounded-full border border-white/10 bg-black/40 overflow-hidden"
          style={{ height: 48, minWidth: 100 }}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <X color="white" size={16} style={{ marginEnd: 6 }} />
          <Text className="text-white text-xs font-bold" style={{ fontFamily: 'Assistant-SemiBold' }}>
            X סגור
          </Text>
        </Pressable>

        {/* Center: Magenta Shutter Action */}
        <Pressable
          onPress={handleCapture}
          disabled={scanState !== 'idle'}
          className="w-20 h-20 rounded-full items-center justify-center border border-white/20 bg-black/30 p-2 shadow-2xl active:scale-95"
          style={{ opacity: scanState === 'idle' ? 1 : 0.5 }}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} className="rounded-full" />
          <View className="w-14 h-14 rounded-full items-center justify-center bg-primary shadow-lg" style={{ shadowColor: Colors.primary, shadowRadius: 10, shadowOpacity: 0.6 }}>
            <Aperture color="white" size={24} />
          </View>
        </Pressable>

        {/* Right Side: Flash Toggle */}
        <Pressable 
          onPress={() => setFlashMode(flashMode === 'on' ? 'off' : 'on')}
          className="flex-row items-center justify-center px-4 rounded-full border border-white/10 bg-black/40 overflow-hidden"
          style={{ height: 48, minWidth: 100 }}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          {flashMode === 'on' ? (
            <>
              <Zap color={Colors.primary} size={16} style={{ marginEnd: 6 }} />
              <Text className="text-white text-xs font-bold" style={{ fontFamily: 'Assistant-SemiBold' }}>
                פלאש פעיל ⚡
              </Text>
            </>
          ) : (
            <>
              <ZapOff color="white" size={16} style={{ marginEnd: 6 }} />
              <Text className="text-white text-xs font-bold" style={{ fontFamily: 'Assistant-SemiBold' }}>
                פלאש כבוי ⚡
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {/* Success Notification overlay & details */}
      {scanState === 'success' && (
        <Animated.View 
          style={[styles.successContainer, successUIStyle]}
          className="absolute w-full px-6"
        >
          <BlurView 
            intensity={45} 
            tint="dark" 
            className="w-full p-6 rounded-[24px] border border-white/10 bg-black/40 items-center shadow-2xl"
          >
            <CheckCircle2 color={Colors.secondary} size={48} className="mb-2" />
            <Text className="text-white text-xl font-bold text-center mb-1" style={{ fontFamily: 'Rubik-Bold' }}>
              הבול הוטבע בהצלחה!
            </Text>
            <Text className="text-white/70 text-sm text-center mb-6" style={{ fontFamily: 'Assistant-Regular' }}>
              בול כרזת הסרט הועבר ישירות לארנק הבולים שלך בפרופיל
            </Text>
            
            <View className="flex-col gap-3 w-full">
              {/* Row 1: Real Save to Gallery / Share Button */}
              <Pressable 
                onPress={handleSaveToGallery}
                disabled={isSavingImage || isSavingToDrive}
                className="w-full py-3.5 rounded-xl bg-secondary flex-row justify-center items-center gap-2 active:scale-95 shadow-lg"
                style={{ shadowColor: Colors.secondary, shadowRadius: 8, shadowOpacity: 0.3 }}
              >
                {isSavingImage ? (
                  <ActivityIndicator size="small" color="#09090B" />
                ) : (
                  <Download color="#09090B" size={18} />
                )}
                <Text className="text-[#09090B] font-bold text-sm" style={{ fontFamily: 'Rubik-Medium' }}>
                  {isSavingImage ? 'שומר בגלריה...' : 'שמור בגלריית המכשיר 💾'}
                </Text>
              </Pressable>

              {/* Row 2: Save to Google Drive Button */}
              <Pressable 
                onPress={handleSaveToDrive}
                disabled={isSavingImage || isSavingToDrive}
                className="w-full py-3.5 rounded-xl bg-blue-600 flex-row justify-center items-center gap-2 active:scale-95 shadow-lg"
                style={{ shadowColor: '#2563eb', shadowRadius: 8, shadowOpacity: 0.3 }}
              >
                {isSavingToDrive ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <CloudLightning color="white" size={18} />
                )}
                <Text className="text-white font-bold text-sm" style={{ fontFamily: 'Rubik-Medium' }}>
                  {isSavingToDrive ? 'שומר ב-Drive...' : 'שמור ב-Google Drive ☁️'}
                </Text>
              </Pressable>

              {/* Row 3: Scan Again / Finished */}
              <View className="flex-row gap-3 w-full">
                <Pressable 
                  onPress={handleReset}
                  className="flex-1 py-3.5 rounded-xl border border-white/20 bg-white/5 flex-row justify-center items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw color="white" size={14} />
                  <Text className="text-white font-bold text-sm" style={{ fontFamily: 'Rubik-Medium' }}>
                    סרוק שוב
                  </Text>
                </Pressable>
                
                <Pressable 
                  onPress={handleClose}
                  className="flex-1 py-3.5 rounded-xl bg-primary items-center active:scale-95"
                >
                  <Text className="text-white font-bold text-sm" style={{ fontFamily: 'Rubik-Medium' }}>
                    סיום
                  </Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Floating Save Success Toast Notification */}
      {saveSuccess && (
        <Animated.View className="absolute top-24 left-6 right-6 z-50 rounded-2xl border border-secondary/30 bg-black/90 p-4 shadow-2xl flex-row items-center justify-center gap-3">
          <CheckCircle2 color={Colors.secondary} size={20} />
          <Text className="text-white text-sm font-bold" style={{ fontFamily: 'Assistant-SemiBold' }}>
            הבול נשמר בהצלחה בגלריית המכשיר! 📸
          </Text>
        </Animated.View>
      )}

      {/* Floating Google Drive Save Success Toast Notification */}
      {driveSaveSuccess && (
        <Animated.View className="absolute top-24 left-6 right-6 z-50 rounded-2xl border border-blue-500/30 bg-black/90 p-4 shadow-2xl flex-row items-center justify-center gap-3">
          <CheckCircle2 color="#2563eb" size={20} />
          <Text className="text-white text-sm font-bold" style={{ fontFamily: 'Assistant-SemiBold' }}>
            הבול הועלה בהצלחה ל-Google Drive! ☁️🚀
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  viewfinderWrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  targetWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetBox: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.9,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#D4FF00',
    shadowColor: '#D4FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserScanline: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#D4FF00',
    shadowColor: '#D4FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  stampCanvas: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  stampCard: {
    width: SCREEN_WIDTH * 0.78,
    height: SCREEN_WIDTH * 1.1,
    borderRadius: 12,
    position: 'relative',
    overflow: 'visible', // Kept visible so perforation holes cut in from outside!
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  coinContainer: {
    width: SCREEN_WIDTH * 0.44,
    height: SCREEN_WIDTH * 0.44,
    borderRadius: (SCREEN_WIDTH * 0.44) / 2,
    position: 'relative',
    marginTop: 10,
  },
  perforationLine: {
    position: 'absolute',
    justifyContent: 'space-between',
  },
  perforationRow: {
    flexDirection: 'row',
    left: 0,
    right: 0,
  },
  perforationCol: {
    flexDirection: 'column',
    top: 0,
    bottom: 0,
  },
  perforationHole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#09090B',
  },
  successContainer: {
    bottom: 30,
    left: 0,
    right: 0,
    zIndex: 40,
    alignItems: 'center',
  }
});
