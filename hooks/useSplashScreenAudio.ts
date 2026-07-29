import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Audio } from '../utils/safeExpoAv';
import { playCenterSubBass } from '../utils/SoundEffects';

/**
 * Custom hook to load, play, and safely unload the Splash Screen audio & Gemini AI Speech.
 * Uses SafeExpoAv & Expo Speech to announce 'ברוכים הבאים לסינבוק. חוויה קולנועית מחדש.' on launch.
 */
export const useSplashScreenAudio = () => {
  const soundRef = useRef<any>(null);
  const voiceRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;
    let didStartPlaying = false;
    let hapticTimer1: any = null;
    let hapticTimer2: any = null;
    let voiceTimer: any = null;

    const playRoar = async () => {
      console.log('[useSplashScreenAudio] Initializing splash screen audio & voice hook...');
      try {
        const assetSource = require('../assets/audio/cinematic_whoosh.mp3');
        const voiceSource = require('../assets/audio/cinematic_voice_hebrew.mp3');
        console.log('[useSplashScreenAudio] Audio assets resolved.');

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

        // Try loading voice MP3 asset
        try {
          const { sound: voiceSound } = await Audio.Sound.createAsync(
            voiceSource,
            { volume: 0.95, shouldPlay: false }
          );
          if (!isCancelled) {
            voiceRef.current = voiceSound;
            voiceSound.setOnPlaybackStatusUpdate((status: any) => {
              if (status.didJustFinish) {
                voiceSound.unloadAsync().catch(() => {});
                voiceRef.current = null;
              }
            });
          } else {
            voiceSound.unloadAsync().catch(() => {});
          }
        } catch (voiceErr) {
          console.warn('[useSplashScreenAudio] Voice asset load skipped/failed:', voiceErr);
        }

        // Auto-unload primary sound once playback finishes
        sound.setOnPlaybackStatusUpdate((playbackStatus: any) => {
          if (playbackStatus.didJustFinish) {
            console.log('[useSplashScreenAudio] Audio playback completed. Auto-unloading...');
            sound.unloadAsync().catch((unloadErr: any) => {
              console.warn('[useSplashScreenAudio] Auto-unload failed:', unloadErr);
            });
            soundRef.current = null;
          }
        });

        // Play primary cinematic sound & haptics after 250ms
        hapticTimer1 = setTimeout(async () => {
          if (!isCancelled && soundRef.current) {
            try {
              console.log('[useSplashScreenAudio] Triggering playAsync & acoustic haptics...');
              didStartPlaying = true;
              
              // Safe execution of haptics & center sub-bass tone
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
              try { playCenterSubBass(); } catch {}

              await soundRef.current.playAsync();
            } catch (playErr) {
              console.warn('[useSplashScreenAudio] Playback failed:', playErr);
            }
          } else {
            console.log('[useSplashScreenAudio] Skip playback. isCancelled:', isCancelled, 'soundLoaded:', !!soundRef.current);
          }
        }, 250);

        // Play Gemini AI Voice Speech in Hebrew at 450ms
        voiceTimer = setTimeout(async () => {
          if (!isCancelled) {
            try {
              console.log('[useSplashScreenAudio] Triggering Speech.speak for Gemini voice intro...');
              Speech.speak('ברוכים הבאים לסינבוק. חוויה קולנועית מחדש.', {
                language: 'he-IL',
                rate: 0.85,
                pitch: 0.9,
              });

              if (voiceRef.current) {
                await voiceRef.current.playAsync();
              }
            } catch (vPlayErr) {
              console.warn('[useSplashScreenAudio] Voice playback failed:', vPlayErr);
            }
          }
        }, 450);

        // Secondary acoustic pulse when light sweep passes
        hapticTimer2 = setTimeout(() => {
          if (!isCancelled) {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          }
        }, 750);

      } catch (err) {
        console.warn('[useSplashScreenAudio] Failed to load/play audio:', err);
      }
    };

    playRoar();

    return () => {
      isCancelled = true;
      if (hapticTimer1) clearTimeout(hapticTimer1);
      if (hapticTimer2) clearTimeout(hapticTimer2);
      if (voiceTimer) clearTimeout(voiceTimer);

      const unloadSound = async () => {
        if (soundRef.current && !didStartPlaying) {
          console.log('[useSplashScreenAudio] Cleanup: Unloading sound before playback started...');
          try {
            await soundRef.current.unloadAsync();
          } catch (unloadErr) {
            console.warn('[useSplashScreenAudio] Cleanup unload failed:', unloadErr);
          }
          soundRef.current = null;
        }
        if (voiceRef.current) {
          try { await voiceRef.current.unloadAsync(); } catch {}
          voiceRef.current = null;
        }
      };
      unloadSound();
    };
  }, []);
};
