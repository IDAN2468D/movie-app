import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Smile, Orbit, Ghost, Award, HelpCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { Gyroscope } from '@/utils/SafeModules';
import { type CollectibleItem } from '@/store/useVaultStore';

interface CineVaultCardProps {
  collectible: CollectibleItem;
  isLocked?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // Two column layout with padding

export default function CineVaultCard({ collectible, isLocked = false }: CineVaultCardProps) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (isLocked) return;

    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    const startGyro = async () => {
      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable || !isMounted) {
          // Fallback: floating idle animation
          tiltX.value = withRepeat(withTiming(15, { duration: 3500 }), -1, true);
          tiltY.value = withRepeat(withTiming(10, { duration: 4500 }), -1, true);
          return;
        }

        Gyroscope.setUpdateInterval(16);
        subscription = Gyroscope.addListener((data: { x: number; y: number }) => {
          if (isMounted) {
            // Apply smoothing springs
            tiltX.value = withSpring(data.y * 25, { damping: 20, stiffness: 100 });
            tiltY.value = withSpring(data.x * 25, { damping: 20, stiffness: 100 });
          }
        });
      } catch {
        if (isMounted) {
          tiltX.value = withRepeat(withTiming(15, { duration: 3500 }), -1, true);
          tiltY.value = withRepeat(withTiming(10, { duration: 4500 }), -1, true);
        }
      }
    };

    startGyro();

    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
  }, [isLocked, tiltX, tiltY]);

  // Animated styles for physical card tilt
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 400 },
        { rotateY: `${tiltX.value / 1.5}deg` },
        { rotateX: `${-tiltY.value / 1.5}deg` },
      ]
    };
  });

  // Animated styles for background glowing blobs shifting behind the glass
  const blobAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 1.5 },
        { translateY: tiltY.value * 1.5 }
      ]
    };
  });

  // Glare overlay sweeping animation style
  const glareAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 6 - 80 },
        { translateY: tiltY.value * 6 - 80 }
      ],
      opacity: Math.max(0.05, Math.min(0.28, 0.15 + (tiltX.value + tiltY.value) / 120))
    };
  });

  // Icon shift style (creates 3D depth)
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltX.value * 0.8 },
        { translateY: tiltY.value * 0.8 }
      ]
    };
  });

  // Configure colors based on badgeType
  const getBadgeColors = () => {
    switch (collectible.badgeType) {
      case 'bronze':
        return {
          border: 'rgba(205, 127, 50, 0.35)',
          glow: 'rgba(205, 127, 50, 0.15)',
          text: '#CD7F32',
          gradient: ['#A05822', '#CD7F32', '#F5A962'] as [string, string, ...string[]]
        };
      case 'silver':
        return {
          border: 'rgba(192, 192, 192, 0.4)',
          glow: 'rgba(192, 192, 192, 0.15)',
          text: '#C0C0C0',
          gradient: ['#7F7F7F', '#C0C0C0', '#EAEAEA'] as [string, string, ...string[]]
        };
      case 'gold':
        return {
          border: 'rgba(255, 215, 0, 0.45)',
          glow: 'rgba(255, 215, 0, 0.2)',
          text: '#FFD700',
          gradient: ['#C5A000', '#FFD700', '#FFF3B3'] as [string, string, ...string[]]
        };
      case 'glass':
      default:
        return {
          border: 'rgba(255, 20, 100, 0.35)',
          glow: 'rgba(255, 20, 100, 0.18)',
          text: Colors.primary,
          gradient: [Colors.primary, '#E5FF00', '#00E5FF'] as [string, string, ...string[]]
        };
    }
  };

  const badgeTheme = getBadgeColors();

  // Get genre icon
  const getGenreIcon = () => {
    const color = isLocked ? '#555555' : badgeTheme.text;
    const size = 32;

    switch (collectible.genre?.toLowerCase()) {
      case 'action':
        return <Shield color={color} size={size} strokeWidth={1.5} />;
      case 'comedy':
        return <Smile color={color} size={size} strokeWidth={1.5} />;
      case 'sci-fi':
      case 'fantasy':
        return <Orbit color={color} size={size} strokeWidth={1.5} />;
      case 'horror':
        return <Ghost color={color} size={size} strokeWidth={1.5} />;
      case 'drama':
      default:
        return <Award color={color} size={size} strokeWidth={1.5} />;
    }
  };

  const badgeLabels: Record<string, string> = {
    bronze: 'ברונזה',
    silver: 'כסף',
    gold: 'זהב',
    glass: 'זכוכית קריסטל'
  };

  if (isLocked) {
    return (
      <View 
        style={[styles.card, { borderColor: 'rgba(255, 255, 255, 0.05)' }]} 
        className="bg-[#121214]/40 rounded-3xl overflow-hidden justify-center items-center p-4"
      >
        <HelpCircle color="rgba(255,255,255,0.15)" size={48} />
        <Text style={styles.lockedText} className="font-body mt-4">פריט נעול</Text>
        <Text style={styles.lockedSubText} className="font-caption text-center mt-1">שלם רכישה לקבלת גביש</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.card, { borderColor: badgeTheme.border }, cardAnimatedStyle]}>
      {/* Frosted Glass Base */}
      {Platform.OS !== 'web' ? (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18, 18, 20, 0.7)' }]} />
      )}

      {/* Internal ambient glowing blob */}
      <Animated.View 
        style={[
          styles.ambientBlob, 
          { backgroundColor: badgeTheme.glow },
          blobAnimatedStyle
        ]} 
      />

      {/* Glossy Reflective Glare */}
      <Animated.View style={[styles.glare, glareAnimatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Shard Hologram Container */}
        <View style={styles.hologramContainer}>
          <View style={[styles.hologramRing, { borderColor: badgeTheme.border }]} />
          <Animated.View style={[styles.hologramIcon, iconAnimatedStyle]}>
            {getGenreIcon()}
          </Animated.View>
        </View>

        {/* Title */}
        <Text 
          style={styles.movieTitle} 
          numberOfLines={1} 
          className="font-h3 text-center text-text mt-3"
        >
          {collectible.movieTitle}
        </Text>

        {/* Shard type / Genre info */}
        <View style={styles.infoRow} className="mt-2">
          <LinearGradient
            colors={badgeTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badgeLabelContainer}
          >
            <Text style={styles.badgeLabelText} className="font-caption">
              {badgeLabels[collectible.badgeType] || 'זכוכית'}
            </Text>
          </LinearGradient>
        </View>

        {/* Date earned */}
        <Text style={styles.dateText} className="font-caption text-textMuted mt-2 text-center">
          הושג ב-{new Date(collectible.earnedAt).toLocaleDateString('he-IL')}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.25,
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    height: '70%',
    borderRadius: 999,
  },
  glare: {
    position: 'absolute',
    top: -100,
    bottom: -100,
    left: -50,
    width: 150,
    transform: [{ rotate: '30deg' }],
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hologramContainer: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hologramRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 38,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  hologramIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  movieTitle: {
    fontSize: 14,
    color: '#FAFAF7',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabelContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeLabelText: {
    fontSize: 10,
    color: '#09090B',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 9,
    color: '#A1A1AA',
  },
  lockedText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '500',
  },
  lockedSubText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
  }
});
