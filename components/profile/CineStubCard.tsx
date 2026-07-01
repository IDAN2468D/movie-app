import React from 'react';
import { View, Text, StyleSheet, Dimensions, I18nManager } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CineStubTicket } from '../../store/useCineStubStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

// From 002-CINEBOOK-RULES.md physics
const SpringPresets = {
  organic: {
    damping: 15,
    stiffness: 120,
    mass: 1.0,
  }
};

interface CineStubCardProps {
  ticket: CineStubTicket;
  isActive?: boolean;
}

export function CineStubCard({ ticket, isActive = false }: CineStubCardProps) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      // Map drag translation to rotation. 
      // Dividing by a factor keeps the rotation within a reasonable range (e.g. max 30 degrees)
      rotateX.value = interpolate(event.translationY, [-200, 200], [30, -30], 'clamp');
      rotateY.value = interpolate(event.translationX, [-200, 200], [-30, 30], 'clamp');
    })
    .onEnd(() => {
      // Smooth spring back to 0
      rotateX.value = withSpring(0, SpringPresets.organic);
      rotateY.value = withSpring(0, SpringPresets.organic);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
    };
  });

  // Strict LTR orientation for serial keys, timestamps, seats and rows in forced RTL
  // We use flex-row-reverse as per 002-CINEBOOK-RULES.md to enforce LTR rendering.
  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          
          <LinearGradient 
            colors={['rgba(255, 20, 100, 0.4)', 'rgba(155, 27, 48, 0.1)']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.content}>
            {/* Header (RTL by default) */}
            <Text style={styles.title} numberOfLines={2}>
              {ticket.title}
            </Text>
            
            <View style={styles.spacer} />

            {/* Back of ticket info: MUST be strictly LTR */}
            <View style={styles.ticketInfoBox}>
              <View style={styles.ltrRow}>
                <Text style={styles.ltrLabel}>DATE</Text>
                <Text style={styles.ltrValue}>{ticket.date}</Text>
              </View>

              <View style={styles.ltrRow}>
                <Text style={styles.ltrLabel}>ROW</Text>
                <Text style={styles.ltrValue}>{ticket.row}</Text>
                
                <View style={styles.divider} />
                
                <Text style={styles.ltrLabel}>SEAT</Text>
                <Text style={styles.ltrValue}>{ticket.seat}</Text>
              </View>

              <View style={[styles.ltrRow, styles.serialRow]}>
                <Text style={styles.serialText}>{ticket.serialKey}</Text>
              </View>
            </View>
            
          </View>

          {/* Premium Glass reflective border */}
          <View style={styles.glassBorder} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    // High-Elevation Active Container styling logic could be applied here
    shadowColor: '#FF1464',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Anton-Regular', // English headers font per spec
    color: '#FAFAF7',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spacer: {
    flex: 1,
  },
  ticketInfoBox: {
    backgroundColor: 'rgba(9, 9, 11, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ltrRow: {
    // 002-CINEBOOK-RULES.md: Explicit Left-to-Right (LTR) wrap in flex-row-reverse
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end', // Because row-reverse starts from the end
    marginBottom: 8,
  },
  ltrLabel: {
    fontSize: 12,
    fontFamily: 'Assistant-Regular',
    color: '#A1A1AA',
    paddingEnd: 8, // Logical padding
    writingDirection: 'ltr',
  },
  ltrValue: {
    fontSize: 16,
    fontFamily: 'Assistant-SemiBold',
    color: '#FAFAF7',
    writingDirection: 'ltr',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  serialRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
  },
  serialText: {
    fontSize: 14,
    fontFamily: 'Assistant-Regular',
    color: '#A1A1AA',
    letterSpacing: 2,
    writingDirection: 'ltr',
  },
  glassBorder: {
    ...StyleSheet.absoluteFill as any,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    pointerEvents: 'none',
  }
});
