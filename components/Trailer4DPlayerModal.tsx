import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import * as Haptics from 'expo-haptics';
import { X, Vibrate, VibrateOff } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

interface Trailer4DPlayerModalProps {
  isVisible: boolean;
  onClose: () => void;
  videoKey: string | null;
  title: string;
}

const { width } = Dimensions.get('window');

const Trailer4DPlayerModal: React.FC<Trailer4DPlayerModalProps> = ({
  isVisible,
  onClose,
  videoKey,
  title,
}) => {
  const [playing, setPlaying] = useState(false);
  const [is4DEnabled, setIs4DEnabled] = useState(true);
  const hapticInterval = useRef<any>(null);

  // The 4D Haptic Engine
  const startHapticEngine = useCallback(() => {
    if (!is4DEnabled) return;
    
    const triggerRandomHaptic = () => {
      // Choose a random intensity to simulate different types of action
      const intensities = [
        Haptics.ImpactFeedbackStyle.Heavy,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Light,
      ];
      const randomIntensity = intensities[Math.floor(Math.random() * intensities.length)];
      
      Haptics.impactAsync(randomIntensity);

      // Sometime trigger a notification type for a "boom" effect
      if (Math.random() > 0.8) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Schedule next haptic bump randomly between 200ms and 1500ms
      const nextDelay = Math.random() * 1300 + 200;
      hapticInterval.current = setTimeout(triggerRandomHaptic, nextDelay);
    };

    // Start the loop
    triggerRandomHaptic();
  }, [is4DEnabled]);

  const stopHapticEngine = useCallback(() => {
    if (hapticInterval.current) {
      clearTimeout(hapticInterval.current);
      hapticInterval.current = null;
    }
  }, []);

  // Control engine based on video state
  useEffect(() => {
    if (playing && is4DEnabled) {
      startHapticEngine();
    } else {
      stopHapticEngine();
    }

    return () => stopHapticEngine();
  }, [playing, is4DEnabled, startHapticEngine, stopHapticEngine]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isVisible) {
      setPlaying(false);
      stopHapticEngine();
    }
  }, [isVisible, stopHapticEngine]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'playing') {
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  }, []);

  const toggle4D = () => {
    setIs4DEnabled((prev) => {
      if (!prev) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return !prev;
    });
  };

  if (!videoKey) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,1)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.header}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X color="white" size={24} />
          </Pressable>
        </View>

        <View style={styles.videoContainer}>
          <YoutubeIframe
            height={250}
            width={width}
            play={playing}
            videoId={videoKey}
            onChangeState={onStateChange}
            initialPlayerParams={{
              modestbranding: true,
              rel: false,
            }}
          />
        </View>

        <View style={styles.controlsContainer}>
          <Pressable 
            onPress={toggle4D} 
            style={[styles.hapticToggleBtn, is4DEnabled && styles.hapticToggleBtnActive]}
          >
            {is4DEnabled ? (
              <Vibrate color="white" size={24} />
            ) : (
              <VibrateOff color="rgba(255,255,255,0.5)" size={24} />
            )}
            <Text style={[styles.hapticText, !is4DEnabled && { color: 'rgba(255,255,255,0.5)' }]}>
              {is4DEnabled ? '4D IMMERSION ON' : '4D IMMERSION OFF'}
            </Text>
          </Pressable>
          <Text style={styles.infoText}>
            When ON, your device will simulate intense action sequences and bass through haptic feedback while the trailer plays.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  titleText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    flex: 1,
    marginRight: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  hapticToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hapticToggleBtnActive: {
    backgroundColor: 'rgba(100, 100, 255, 0.2)', // Slight tint to show it's active
    borderColor: Colors.primary,
  },
  hapticText: {
    color: 'white',
    fontFamily: 'Rubik-Bold',
    fontSize: 16,
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    lineHeight: 18,
  }
});

export default Trailer4DPlayerModal;
