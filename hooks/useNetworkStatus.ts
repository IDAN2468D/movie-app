import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { onlineManager } from '@tanstack/react-query';

/**
 * Custom Hook to monitor network status across Native and Web platforms,
 * updating the TanStack Query onlineManager for robust offline capabilities.
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // 1. Web-Specific Listener
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setIsOnline(true);
        onlineManager.setOnline(true);
      };

      const handleOffline = () => {
        setIsOnline(false);
        onlineManager.setOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial state
      setIsOnline(navigator.onLine);
      onlineManager.setOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // 2. Native-Specific Detection with Periodic Server/Internet Pings
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const checkConnectivity = async () => {
      try {
        // Fast HEAD request to public, highly reliable endpoints to verify internet route
        // directly. Bypasses Render.com backend cold-start spin-up delays (which take up to 60s).
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(async () => {
          // Fallback to TMDB API server if google.com fails
          const fbController = new AbortController();
          const fbTimeout = setTimeout(() => fbController.abort(), 2000);
          try {
            const res = await fetch('https://api.themoviedb.org', {
              method: 'HEAD',
              signal: fbController.signal,
              headers: { 'Cache-Control': 'no-cache' }
            });
            clearTimeout(fbTimeout);
            return res;
          } catch (e) {
            clearTimeout(fbTimeout);
            throw e;
          }
        });

        clearTimeout(timeoutId);

        const online = response.ok || response.status >= 200;
        if (isMounted) {
          setIsOnline(online);
          onlineManager.setOnline(online);
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
          onlineManager.setOnline(false);
        }
      }
    };

    // Run immediately on mount
    checkConnectivity();

    // Check periodically every 5 seconds
    intervalId = setInterval(checkConnectivity, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
};
