import { useEffect, useRef } from 'react';
import { Audio } from '../utils/safeExpoAv';

/**
 * Custom hook to load, play, and safely unload the Splash Screen audio (Lion Roar Effect).
 * Uses SafeExpoAv to prevent crashes in non-supported environments.
 */
export const useSplashScreenAudio = () => {
  const soundRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;
    let didStartPlaying = false;

    const playRoar = async () => {
      console.log('[useSplashScreenAudio] Initializing splash screen audio hook...');
      try {
        const assetSource = require('../assets/audio/cinematic_whoosh.mp3');
        console.log('[useSplashScreenAudio] Audio asset resolved to:', assetSource);

        // Set audio mode so it plays on iOS even in silent mode
        if (typeof Audio.setAudioModeAsync === 'function') {
          console.log('[useSplashScreenAudio] Configuring audio mode options...');
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldRouteThroughEarpieceAndroid: false,
            allowsRecordingIOS: false,
            interruptionModeIOS: 1, // DoNotMix
            interruptionModeAndroid: 1, // DoNotMix
            playThroughEarpieceAndroid: false,
          } as any);
        }

        console.log('[useSplashScreenAudio] Loading sound asset...');
        const { sound, status } = await Audio.Sound.createAsync(
          assetSource,
          { volume: 0.8, shouldPlay: false }
        );

        console.log('[useSplashScreenAudio] Audio asset loaded. status.isLoaded:', status?.isLoaded);

        if (isCancelled) {
          console.log('[useSplashScreenAudio] Component unmounted during load. Unloading sound...');
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;

        // Auto-unload the sound once playback finishes to prevent memory leaks
        sound.setOnPlaybackStatusUpdate((playbackStatus: any) => {
          if (playbackStatus.didJustFinish) {
            console.log('[useSplashScreenAudio] Audio playback completed. Auto-unloading...');
            sound.unloadAsync().catch((unloadErr: any) => {
              console.warn('[useSplashScreenAudio] Auto-unload failed:', unloadErr);
            });
            soundRef.current = null;
          }
        });

        // Play the sound after a slight delay to sync with logo animations
        setTimeout(async () => {
          if (!isCancelled && soundRef.current) {
            try {
              console.log('[useSplashScreenAudio] Triggering playAsync...');
              didStartPlaying = true;
              await soundRef.current.playAsync();
            } catch (playErr) {
              console.warn('[useSplashScreenAudio] Playback failed:', playErr);
            }
          } else {
            console.log('[useSplashScreenAudio] Skip playback. isCancelled:', isCancelled, 'soundLoaded:', !!soundRef.current);
          }
        }, 250);
      } catch (err) {
        console.warn('[useSplashScreenAudio] Failed to load/play audio:', err);
      }
    };

    playRoar();

    return () => {
      isCancelled = true;
      const unloadSound = async () => {
        // If unmounted before audio started playing, unload immediately to prevent late playback
        // If it already started, the setOnPlaybackStatusUpdate callback will auto-unload it when it finishes
        if (soundRef.current && !didStartPlaying) {
          console.log('[useSplashScreenAudio] Cleanup: Unloading sound before playback started...');
          try {
            await soundRef.current.unloadAsync();
          } catch (unloadErr) {
            console.warn('[useSplashScreenAudio] Cleanup unload failed:', unloadErr);
          }
          soundRef.current = null;
        }
      };
      unloadSound();
    };
  }, []);
};
