import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, Dimensions, TouchableOpacity } from 'react-native';
import * as CameraModule from 'expo-camera';
import { X, Zap, ZapOff, ScanLine } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, withRepeat, withSequence, withTiming, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Colors } from '@/constants/Theme';

interface TicketScannerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function TicketScannerModal({ isVisible, onClose, onScan }: TicketScannerModalProps) {
  const [permission, requestPermission] = CameraModule.useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const insets = useSafeAreaInsets();
  
  const scanLinePos = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setScanned(false);
      scanLinePos.value = withRepeat(
        withSequence(
          withTiming(SCAN_AREA_SIZE, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      );
    }
  }, [isVisible, scanLinePos]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePos.value }],
  }));

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <View className="flex-1 bg-background justify-center items-center px-10">
          <Text className="text-white text-h2 text-center font-display mb-4">נדרשת גישה למצלמה</Text>
          <Text className="text-textSecondary text-center font-body mb-8">כדי לסרוק כרטיסים, עלינו לקבל גישה למצלמה שלך.</Text>
          <Pressable
            onPress={requestPermission}
            className="bg-primary px-8 py-3.5 rounded-2xl"
          >
            <Text className="text-background font-bold text-h3 font-display">אפשר גישה</Text>
          </Pressable>
          <Pressable onPress={onClose} className="mt-6">
            <Text className="text-primary font-bold font-body">ביטול</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScan(data);
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent={false}>
      <View className="flex-1 bg-black">
        {CameraModule.CameraView ? (
          <CameraModule.CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            enableTorch={torch}
          />
        ) : (
          <View className="flex-1 bg-black justify-center items-center p-10">
            <Text className="text-white text-h2 text-center font-display mb-4">מודול מצלמה חסר</Text>
            <Text className="text-textSecondary text-center font-body mb-8">
              נראה שהאפליקציה מורצת בסביבה ללא תמיכה במצלמה (כמו Expo Go או ללא Build נייטיב).
            </Text>
            <Pressable
              onPress={() => handleBarCodeScanned({ data: 'MOCK-TICKET-123' })}
              className="bg-primary/20 border border-primary px-8 py-3.5 rounded-2xl mb-4"
            >
              <Text className="text-primary font-bold text-h3 font-display">סמלציה של סריקה</Text>
            </Pressable>
            <Pressable onPress={onClose}>
              <Text className="text-white/50 font-body">סגור</Text>
            </Pressable>
          </View>
        )}

        {/* Overlay */}
        <View style={StyleSheet.absoluteFillObject} className="items-center justify-center">
          <View className="bg-black/50 absolute top-0 w-full h-full" />
          
          {/* Scan Area */}
          <View 
            style={{ width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE }} 
            className="border-2 border-primary/50 rounded-[40px] overflow-hidden bg-transparent"
          >
            <Animated.View 
              style={[
                { height: 2, width: '100%', backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowRadius: 10, shadowOpacity: 0.8, elevation: 5 },
                animatedLineStyle
              ]} 
            />
            
            {/* Corners */}
            <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-3xl" />
          </View>

          <Text className="text-white text-center mt-10 px-10 font-display text-h3">
            מקם את קוד ה-QR בתוך המסגרת לסריקה מהירה
          </Text>
        </View>

        {/* Controls */}
        <View 
          className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-6"
          style={{ paddingTop: insets.top + 20 }}
        >
          <TouchableOpacity 
            onPress={onClose}
            className="w-12 h-12 rounded-full bg-black/40 items-center justify-center border border-white/10"
          >
            <X color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setTorch(!torch)}
            className="w-12 h-12 rounded-full bg-black/40 items-center justify-center border border-white/10"
          >
            {torch ? <ZapOff color={Colors.primary} size={24} /> : <Zap color="white" size={24} />}
          </TouchableOpacity>
        </View>

        {/* Bottom Status */}
        {scanned && (
          <Animated.View 
            entering={FadeIn}
            className="absolute bottom-20 left-10 right-10 bg-surface p-6 rounded-[32px] border border-primary/20 items-center"
          >
            <View className="bg-primary/20 p-3 rounded-2xl mb-3">
              <ScanLine size={24} color={Colors.primary} />
            </View>
            <Text className="text-white text-h3 font-display">הכרטיס נסרק בהצלחה!</Text>
            <Text className="text-textSecondary text-center mt-2 font-body">מייד נעבור לפרטי הכרטיס...</Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}
