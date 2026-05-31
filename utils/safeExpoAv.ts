import type { Audio as ExpoAudio } from 'expo-av';

let AudioVal: any;
let isAudioAvailable = false;

try {
  // Use require inside try-catch to prevent crash at import time in environments without the native module
  const NativeAv = require('expo-av');
  if (NativeAv && NativeAv.Audio) {
    AudioVal = NativeAv.Audio;
    isAudioAvailable = true;
  }
} catch (e) {
  // Silent fallback mock for Audio class, subclasses, and static methods
  const mockSoundInstance = {
    loadAsync: async () => ({ isLoaded: true }),
    unloadAsync: async () => {},
    playAsync: async () => {},
    pauseAsync: async () => {},
    stopAsync: async () => {},
    setVolumeAsync: async () => {},
    setStatusAsync: async () => {},
    setOnPlaybackStatusUpdate: () => {},
  };

  const mockRecordingInstance = {
    prepareToRecordAsync: async () => {},
    startAsync: async () => {},
    stopAndUnloadAsync: async () => {},
    getURI: () => 'mock-recording-uri.m4a',
  };

  AudioVal = {
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    setAudioModeAsync: async () => {},
    Sound: {
      createAsync: async (source: any, initialStatus?: any, onPlaybackStatusUpdate?: any) => {
        console.log('[SafeExpoAv Mock] Sound.createAsync called');
        return {
          sound: mockSoundInstance,
          status: { isLoaded: true },
        };
      },
    },
    Recording: {
      createAsync: async (options?: any, onPlaybackStatusUpdate?: any) => {
        console.log('[SafeExpoAv Mock] Recording.createAsync called');
        return {
          recording: mockRecordingInstance,
          status: { canRecord: true },
        };
      },
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  };
}

// Merge namespace (for compile-time types) and const (for runtime values)
export namespace Audio {
  export type Sound = ExpoAudio.Sound;
  export type Recording = ExpoAudio.Recording;
}

export const Audio = AudioVal;
export { isAudioAvailable };
