import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Banknote {
  id: number;
  value: number;
  color: string;
  startX: number;
  delay: number;
  duration: number;
  rotation: number;
}

interface ShekelRainProps {
  amount: number;
  onAnimationEnd: () => void;
}

const FallingBill = ({ bill, onFinished }: { bill: Banknote; onFinished: () => void }) => {
  const translateY = useSharedValue(-150);
  const rotate = useSharedValue(bill.rotation);
  const translateX = useSharedValue(0);

  const onFinishedRef = React.useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    translateY.value = withDelay(
      bill.delay,
      withTiming(SCREEN_HEIGHT + 150, { duration: bill.duration }, (finished) => {
        if (finished) {
          runOnJS(onFinishedRef.current)();
        }
      })
    );

    translateX.value = withDelay(
      bill.delay,
      withTiming((Math.random() - 0.5) * 120, { duration: bill.duration })
    );

    rotate.value = withDelay(
      bill.delay,
      withTiming(bill.rotation + (Math.random() > 0.5 ? 720 : -720), {
        duration: bill.duration,
      })
    );
  }, [bill.id, bill.delay, bill.duration, bill.rotation, rotate, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  // Select gradient colors based on denomination (matching real Israeli Banknote colors)
  const getGradientColors = (value: number) => {
    switch (value) {
      case 200: return ['#1E3A8A', '#2563EB', '#3B82F6', '#1D4ED8']; // Blue (Nathan Alterman)
      case 100: return ['#C2410C', '#EA580C', '#F97316', '#F59E0B']; // Orange/Gold (Leah Goldberg)
      case 50:  return ['#047857', '#059669', '#10B981', '#34D399']; // Green (Shaul Tchernichovsky)
      case 20:  return ['#B91C1C', '#DC2626', '#EF4444', '#F87171']; // Red (Rachel the Poetess)
      default:  return ['#374151', '#4B5563', '#6B7280', '#9CA3AF'];
    }
  };

  // Select profile portrait for the poet
  const getPoetPortrait = (value: number) => {
    switch (value) {
      case 200: return '👓'; // Nathan Alterman
      case 100: return '📖'; // Leah Goldberg
      case 50:  return '🖋️'; // Shaul Tchernichovsky
      case 20:  return '🌿'; // Rachel the Poetess
      default:  return '👤';
    }
  };

  const gradientColors = getGradientColors(bill.value);
  const poetIcon = getPoetPortrait(bill.value);

  return (
    <Animated.View
      style={[
        styles.billContainer,
        {
          left: bill.startX,
          shadowColor: bill.color,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.billGradient}
      >
        {/* Holographic vertical security strip */}
        <View style={styles.securityStrip}>
          <View style={styles.securityDash} />
          <View style={[styles.securityDash, { backgroundColor: '#FBBF24' }]} />
          <View style={styles.securityDash} />
        </View>

        {/* Faint watermark area */}
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>{poetIcon}</Text>
        </View>

        {/* Bank of Israel text and Serial number */}
        <View style={styles.billHeader}>
          <Text style={styles.bankName}>בנק ישראל</Text>
          <Text style={styles.serialNumber}>S/N: {bill.id}092817</Text>
        </View>

        {/* Central denomination and currency description */}
        <View style={styles.billCenter}>
          <Text style={styles.valueText}>{bill.value}</Text>
          <Text style={styles.currencyName}>שקלים חדשים</Text>
        </View>

        {/* Corner denomination tags */}
        <Text style={styles.cornerValueTop}>{bill.value}</Text>
        <Text style={styles.cornerValueBottom}>{bill.value}</Text>

        {/* Tiny signature squiggle */}
        <Text style={styles.signature}>Governor ʃʃ</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function ShekelRain({ amount, onAnimationEnd }: ShekelRainProps) {
  const [bills, setBills] = useState<Banknote[]>([]);
  const [finishedCount, setFinishedCount] = useState(0);

  useEffect(() => {
    // Generate shekel bills totaling the amount (greedy representation + flurries)
    let remaining = Math.max(amount, 20); // Minimum amount representation
    const generatedBills: Banknote[] = [];
    let idCounter = 0;

    const denominations = [
      { value: 200, color: '#1E40AF' }, // Blue
      { value: 100, color: '#EA580C' }, // Orange
      { value: 50, color: '#16A34A' },  // Green
      { value: 20, color: '#DC2626' }   // Red
    ];

    // Greedy breakdown
    denominations.forEach((denom) => {
      const count = Math.floor(remaining / denom.value);
      remaining = remaining % denom.value;
      
      for (let i = 0; i < count; i++) {
        generatedBills.push({
          id: idCounter++,
          value: denom.value,
          color: denom.color,
          startX: Math.random() * (SCREEN_WIDTH - 130) + 5,
          delay: Math.random() * 1500,
          duration: 5000 + Math.random() * 3000, // Falls much slower (5s to 8s)
          rotation: (Math.random() - 0.5) * 60
        });
      }
    });

    // Add extra decorative bills to make the "rain" effect richer if total count is small
    const decorativeCount = Math.max(15 - generatedBills.length, 8);
    for (let i = 0; i < decorativeCount; i++) {
      const randomDenom = denominations[Math.floor(Math.random() * denominations.length)];
      generatedBills.push({
        id: idCounter++,
        value: randomDenom.value,
        color: randomDenom.color,
        startX: Math.random() * (SCREEN_WIDTH - 130) + 5,
        delay: Math.random() * 2500,
        duration: 5500 + Math.random() * 3500, // Falls much slower (5.5s to 9s)
        rotation: (Math.random() - 0.5) * 90
      });
    }

    setBills(generatedBills);
  }, [amount]);

  const handleBillFinished = () => {
    setFinishedCount((prev) => prev + 1);
  };

  useEffect(() => {
    if (bills.length > 0 && finishedCount >= bills.length) {
      onAnimationEnd();
    }
  }, [finishedCount, bills.length, onAnimationEnd]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bills.map((bill) => (
        <FallingBill 
          key={bill.id} 
          bill={bill} 
          onFinished={handleBillFinished} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  billContainer: {
    position: 'absolute',
    width: 120,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  billGradient: {
    flex: 1,
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  securityStrip: {
    width: 5,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    position: 'absolute',
    left: 24,
    top: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  securityDash: {
    width: 3,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    opacity: 0.8,
  },
  watermarkContainer: {
    position: 'absolute',
    left: 36,
    top: '25%',
    opacity: 0.12,
  },
  watermarkText: {
    fontSize: 24,
  },
  billHeader: {
    position: 'absolute',
    top: 2,
    left: 32,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 7,
    fontFamily: 'Assistant-Bold',
  },
  serialNumber: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 5,
    fontFamily: 'Courier',
  },
  billCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
    fontFamily: 'Outfit-Bold',
  },
  currencyName: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 6,
    marginTop: -2,
    fontFamily: 'Assistant-Regular',
  },
  cornerValueTop: {
    position: 'absolute',
    top: 2,
    left: 4,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 7,
    fontWeight: 'bold',
  },
  cornerValueBottom: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 7,
    fontWeight: 'bold',
  },
  signature: {
    position: 'absolute',
    bottom: 2,
    left: 32,
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 5,
    fontStyle: 'italic',
  },
});
