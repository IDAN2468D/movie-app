import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';

interface Spatial3DAudioPlayerProps {
  isPlaying: boolean;
  activePreset: string;
  onAngleChange?: (pan: number) => void;
}

export const Spatial3DAudioPlayer: React.FC<Spatial3DAudioPlayerProps> = ({
  isPlaying,
  activePreset,
  onAngleChange,
}) => {
  const panX = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    let subscription: any;
    if (isPlaying) {
      Gyroscope.setUpdateInterval(33);
      subscription = Gyroscope.addListener((data) => {
        const clampedY = Math.max(-1, Math.min(1, data.y * 1.5));
        panX.value = withSpring(clampedY * 40, { damping: 15, stiffness: 120 });
        if (onAngleChange) {
          onAngleChange(clampedY);
        }
      });
    } else {
      panX.value = withSpring(0);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isPlaying]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }, { scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.glassFrame}>
        <View style={styles.audioWaveGrid}>
          <Animated.View style={[styles.spatialIndicator, indicatorStyle]}>
            <View style={styles.innerCore} />
          </Animated.View>
        </View>
        <View style={styles.badgeContainer}>
          <Text style={styles.presetText}>🔊 3D Spatial: {activePreset}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 160,
    marginVertical: 12,
  },
  glassFrame: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  audioWaveGrid: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spatialIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  innerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5FF00',
  },
  badgeContainer: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  presetText: {
    color: '#F0F0F0',
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
});
