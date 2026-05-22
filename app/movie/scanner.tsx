/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, Zap, ZapOff, Camera, ArrowLeft, Aperture } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Theme';
import ScannerOverlay from '../../components/ScannerOverlay';
import { usePosterScanner } from '../../hooks/usePosterScanner';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { scannerState, errorMessage, handleFrameCapture } = usePosterScanner();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Text className="text-text font-assistant text-lg tracking-wider animate-pulse">
          טוען עדשת סריקה...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer} className="bg-background px-8 justify-center items-center">
        {/* Beautiful Glass Prompt */}
        <BlurView 
          intensity={40} 
          tint="dark" 
          className="w-full p-8 rounded-3xl border border-white/10 items-center bg-surfaceDark/50 shadow-2xl"
        >
          <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-6">
            <Camera color={Colors.primary} size={36} />
          </View>
          
          <Text className="text-text font-rubik text-2xl mb-3 w-full" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
            דרושה גישה למצלמה
          </Text>
          
          <Text className="text-textSecondary font-assistant mb-8 text-sm leading-relaxed w-full" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
            כדי לזהות כרזות סרטים ברחוב ולהציג לך את עמודי ההזמנה המתאימים ביותר, עלינו להפעיל את מצלמת המכשיר.
          </Text>

          <TouchableOpacity 
            activeOpacity={0.8}
            className="bg-primary py-4 rounded-2xl w-full items-center shadow-lg"
            style={{ shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
            onPress={requestPermission}
          >
            <Text className="text-white font-assistant text-base font-bold">
              אשר גישה למצלמה
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="mt-6 flex-row items-center" 
            onPress={() => router.back()}
          >
            <ArrowLeft color={Colors.textSecondary} size={16} style={{ marginRight: 6 }} />
            <Text className="text-textSecondary font-assistant text-sm">חזור למסך הבית</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  const toggleFlash = () => setFlash(f => !f);

  const takePictureAndAnalyze = async () => {
    if (!cameraRef.current || scannerState !== 'idle') return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
      });
      
      if (photo?.uri) {
        handleFrameCapture(photo.uri);
      }
    } catch (e) {
      console.error('Failed to take picture', e);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flash}
      />
      
      {/* Visual Overlay covering focusing mask, laser scanner, and statuses */}
      <ScannerOverlay scannerState={scannerState} errorMessage={errorMessage} />

      {/* Floating Bottom Dashboard - Ergonomic Thumb Zone Layout */}
      <View 
        className="absolute w-full px-6 z-30 items-center justify-between"
        style={{ 
          bottom: Math.max(insets.bottom + 24, 52),
          flexDirection: 'row',
          direction: 'ltr'
        }}
      >
        {/* Left Side: Back/Close Button */}
        <TouchableOpacity 
          activeOpacity={0.75}
          onPress={() => router.back()} 
          className="flex-row items-center px-4 rounded-full overflow-hidden border border-white/10 shadow-lg"
          style={{ height: 48, minWidth: 105, justifyContent: 'center' }}
        >
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFillObject} />
          <X color="white" size={16} style={{ marginRight: 6 }} />
          <Text className="text-white font-assistant text-xs font-semibold" style={{ textAlign: 'left', writingDirection: 'ltr' }}>
            סגור
          </Text>
        </TouchableOpacity>

        {/* Center: Futuristic Squircle Shutter */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={scannerState !== 'idle'}
          onPress={takePictureAndAnalyze}
          style={{ opacity: scannerState === 'idle' ? 1 : 0.4 }}
        >
          <View className="w-22 h-22 rounded-3xl items-center justify-center border border-white/20 bg-black/35 p-3 shadow-2xl">
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} className="rounded-3xl" />
            <View 
              className="w-16 h-16 rounded-full items-center justify-center bg-primary"
              style={{
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.8,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Aperture color="white" size={28} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Side: Flash Toggle */}
        <TouchableOpacity 
          activeOpacity={0.75}
          onPress={toggleFlash} 
          className="flex-row items-center px-4 rounded-full overflow-hidden border border-white/10 shadow-lg"
          style={{ height: 48, minWidth: 105 }}
        >
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFillObject} />
          {flash ? (
            <Zap color={Colors.secondary} size={16} style={{ marginRight: 6 }} />
          ) : (
            <ZapOff color="white" size={16} style={{ marginRight: 6 }} />
          )}
          <Text className="text-white font-assistant text-xs font-semibold" style={{ textAlign: 'left', writingDirection: 'ltr' }}>
            {flash ? 'פלאש פעיל' : 'פלאש כבוי'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    flex: 1,
  },
});
