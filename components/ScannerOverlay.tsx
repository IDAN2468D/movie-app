/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';
import { ScannerState } from '../hooks/usePosterScanner';

const { width, height } = Dimensions.get('window');
const SCAN_WIDTH = width * 0.75;
const SCAN_HEIGHT = SCAN_WIDTH * 1.4; // Poster aspect ratio

interface ScannerOverlayProps {
  scannerState: ScannerState;
  errorMessage?: string | null;
}

export default function ScannerOverlay({ scannerState, errorMessage }: ScannerOverlayProps) {
  // --- Reanimated Shared Values ---
  const laserPositionY = useSharedValue(0);
  const cornerPulse = useSharedValue(0.6);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    // Corner pulse animation (constant)
    cornerPulse.value = withRepeat(
      withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    if (scannerState === 'identifying') {
      // Fast active laser scanning
      laserPositionY.value = withRepeat(
        withTiming(SCAN_HEIGHT, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (scannerState === 'success') {
      // Trigger a brilliant visual camera shutter flash
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
      laserPositionY.value = withTiming(SCAN_HEIGHT / 2);
    } else {
      // Idle or error
      laserPositionY.value = withTiming(0);
    }
  }, [scannerState, laserPositionY, cornerPulse, flashOpacity]);

  // Animated styles
  const laserAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: laserPositionY.value }],
      opacity: scannerState === 'identifying' ? 1 : 0,
    };
  });

  const cornerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cornerPulse.value,
      transform: [{ scale: withTiming(scannerState === 'identifying' ? 1.03 : 1.0) }],
    };
  });

  const flashAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: flashOpacity.value,
    };
  });

  const successGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: scannerState === 'success' ? 1 : 0,
      transform: [{ scale: scannerState === 'success' ? withTiming(1.02) : 1.0 }],
    };
  });

  const aiDotAnimatedStyle = useAnimatedStyle(() => {
    const isScanning = scannerState === 'identifying';
    return {
      opacity: isScanning ? cornerPulse.value : 0,
      transform: [{ scale: isScanning ? cornerPulse.value : 0.5 }],
    };
  });

  // Cutout mask measurements
  const maskTopHeight = (height - SCAN_HEIGHT) / 2;
  const maskLeftWidth = (width - SCAN_WIDTH) / 2;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      
      {/* 4-Piece Camera Cutout Focus Mask */}
      {/* Top Mask */}
      <View 
        style={[styles.maskSegment, { top: 0, left: 0, right: 0, height: maskTopHeight }]} 
      />
      {/* Bottom Mask */}
      <View 
        style={[styles.maskSegment, { bottom: 0, left: 0, right: 0, height: maskTopHeight }]} 
      />
      {/* Left Mask */}
      <View 
        style={[
          styles.maskSegment, 
          { top: maskTopHeight, left: 0, width: maskLeftWidth, height: SCAN_HEIGHT }
        ]} 
      />
      {/* Right Mask */}
      <View 
        style={[
          styles.maskSegment, 
          { top: maskTopHeight, right: 0, width: maskLeftWidth, height: SCAN_HEIGHT }
        ]} 
      />

      {/* Top Glass Header */}
      <BlurView 
        intensity={40} 
        tint="dark" 
        style={styles.headerGlass}
        className="absolute top-0 w-full pt-16 pb-6 px-6 items-center border-b border-white/10"
      >
        <Text className="text-text font-rubik text-xl w-full" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
          CineVision
        </Text>
        <Text className="text-textSecondary font-assistant text-sm w-full mt-1" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
          מקד את המצלמה אל כרזת הסרט לסריקה מהירה
        </Text>
      </BlurView>

      {/* Center Target Scanning Box */}
      <View style={styles.scanningContainer}>
        <View style={styles.reticleContainer}>
          {/* Animated Glowing Corners */}
          <Animated.View style={[styles.corner, styles.topLeft, cornerAnimatedStyle]} />
          <Animated.View style={[styles.corner, styles.topRight, cornerAnimatedStyle]} />
          <Animated.View style={[styles.corner, styles.bottomLeft, cornerAnimatedStyle]} />
          <Animated.View style={[styles.corner, styles.bottomRight, cornerAnimatedStyle]} />

          {/* Animated Holographic Laser line */}
          <Animated.View style={[styles.laser, laserAnimatedStyle]} />

          {/* Animated AI Target Nodes */}
          <Animated.View style={[styles.aiNode, { top: '22%', left: '18%' }, aiDotAnimatedStyle]}>
            <View style={styles.aiNodeCore} />
          </Animated.View>
          <Animated.View style={[styles.aiNode, { top: '42%', right: '22%' }, aiDotAnimatedStyle]}>
            <View style={styles.aiNodeCore} />
          </Animated.View>
          <Animated.View style={[styles.aiNode, { bottom: '28%', left: '30%' }, aiDotAnimatedStyle]}>
            <View style={styles.aiNodeCore} />
          </Animated.View>
          <Animated.View style={[styles.aiNode, { bottom: '48%', right: '12%' }, aiDotAnimatedStyle]}>
            <View style={styles.aiNodeCore} />
          </Animated.View>

          {/* Success Frame Glow */}
          <Animated.View style={[styles.successGlow, successGlowStyle]} />
        </View>
      </View>

      {/* Status Messages */}
      <View className="absolute bottom-40 w-full px-8 items-center z-30">
        {scannerState === 'identifying' && (
          <BlurView intensity={65} tint="dark" className="px-6 py-3 rounded-full border border-white/20 shadow-lg bg-black/40">
            <Text className="text-white font-assistant text-base font-medium animate-pulse" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
              מפענח כרזה באמצעות AI...
            </Text>
          </BlurView>
        )}
        
        {scannerState === 'success' && (
          <BlurView intensity={70} tint="dark" className="px-6 py-3 rounded-full border border-secondary/60 shadow-xl bg-black/30">
            <Text className="text-secondary font-assistant font-bold text-base" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
              הסרט זוהה בהצלחה!
            </Text>
          </BlurView>
        )}

        {scannerState === 'error' && (
          <BlurView intensity={70} tint="dark" className="px-6 py-4 rounded-3xl border border-primary/50 bg-black/60 shadow-xl max-w-[85%]">
            <Text className="text-primary font-assistant text-sm font-medium" style={{ writingDirection: 'ltr', textAlign: 'center' }}>
              {errorMessage || 'שגיאה בזיהוי. נסה שוב.'}
            </Text>
          </BlurView>
        )}
      </View>

      {/* Camera Capture Shutter Flash Screen Effect */}
      <Animated.View style={[styles.flashScreen, flashAnimatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  maskSegment: {
    position: 'absolute',
    backgroundColor: 'rgba(7, 10, 15, 0.65)', // Sleek dark matching our background tint
  },
  headerGlass: {
    zIndex: 40,
  },
  scanningContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  reticleContainer: {
    width: SCAN_WIDTH,
    height: SCAN_HEIGHT,
    position: 'relative',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 24,
  },
  laser: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: 2,
  },
  successGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(229, 255, 0, 0.08)',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
  },
  aiNode: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondaryDim,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 255, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  aiNodeCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  flashScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 50,
  },
});
