import { useEffect } from 'react';
import { Gyroscope } from 'expo-sensors';
import { useSharedValue, withSpring } from 'react-native-reanimated';

export function useGyroscopePan() {
  const gyroX = useSharedValue(0);
  const gyroY = useSharedValue(0);
  const spatialPan = useSharedValue(0.5); // 0.0 Left (Right in LTR, Left in RTL), 1.0 Right

  useEffect(() => {
    // Set high-frequency update interval
    Gyroscope.setUpdateInterval(60);
    
    const subscription = Gyroscope.addListener((data) => {
      // Map Y rotation (roll) to panning value (0.0 to 1.0)
      const mappedPan = Math.max(0, Math.min(1, 0.5 + (data.y * 0.3)));
      spatialPan.value = withSpring(mappedPan, { damping: 15 });
      
      // Map Roll and Pitch to translation shifts for 3D parallax screen float
      gyroX.value = withSpring(data.y * 15, { damping: 12 });
      gyroY.value = withSpring(data.x * 15, { damping: 12 });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { gyroX, gyroY, spatialPan };
}
