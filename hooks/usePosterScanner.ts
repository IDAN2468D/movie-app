import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { visionService } from '../services/VisionService';

export type ScannerState = 'idle' | 'identifying' | 'success' | 'error';

export function usePosterScanner() {
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleFrameCapture = useCallback(async (imageUri: string) => {
    if (scannerState !== 'idle' && scannerState !== 'error') {
      return; // Prevent multiple requests while processing
    }

    setScannerState('identifying');
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await visionService.identifyPoster(imageUri);

      if (result.success && result.movieId) {
        setScannerState('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate to the movie screen after a brief delay to show success state
        setTimeout(() => {
          router.push(`/movie/${result.movieId}`);
          // Reset state after navigation
          setTimeout(() => setScannerState('idle'), 500);
        }, 1000);
      } else {
        setScannerState('error');
        setErrorMessage(result.error || 'אירעה שגיאה בזיהוי הפוסטר.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Reset back to idle after showing error for a bit
        setTimeout(() => setScannerState('idle'), 3000);
      }
    } catch (error) {
      console.error('[usePosterScanner] Error identifying poster:', error);
      setScannerState('error');
      setErrorMessage('שגיאת תקשורת. אנא בדוק את החיבור לרשת.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setScannerState('idle'), 3000);
    }
  }, [scannerState, router]);

  const resetScanner = useCallback(() => {
    setScannerState('idle');
    setErrorMessage(null);
  }, []);

  return {
    scannerState,
    errorMessage,
    handleFrameCapture,
    resetScanner,
  };
}
