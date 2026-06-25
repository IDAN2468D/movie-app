import React from 'react';
import { View, Text } from 'react-native';

let AudioVal: any;
let VideoVal: any;
let ResizeModeVal: any = { CONTAIN: 'contain', COVER: 'cover', STRETCH: 'stretch' };
let isAudioAvailable = false;

try {
  // Use require inside try-catch to prevent crash at import time in environments without the native module
  const NativeAv = require('expo-av');
  if (NativeAv && NativeAv.Audio) {
    AudioVal = NativeAv.Audio;
    isAudioAvailable = true;
  }
  if (NativeAv && NativeAv.Video) {
    VideoVal = NativeAv.Video;
  }
  if (NativeAv && NativeAv.ResizeMode) {
    ResizeModeVal = NativeAv.ResizeMode;
  }
} catch (e) {
  // Safe fallbacks handled below
}

if (!AudioVal) {
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
    setOnRecordingStatusUpdate: () => {},
    setProgressUpdateInterval: () => {},
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

if (!VideoVal) {
  VideoVal = React.forwardRef(({ style, source, resizeMode, shouldPlay: initialShouldPlay = false, isLooping, onPlaybackStatusUpdate, ...props }: any, ref: any) => {
    const [isPlaying, setIsPlaying] = React.useState(initialShouldPlay);
    const positionMillisRef = React.useRef(0);

    React.useEffect(() => {
      setIsPlaying(initialShouldPlay);
    }, [initialShouldPlay]);

    // Simulate periodic playback status update for haptics triggering
    React.useEffect(() => {
      if (isPlaying && onPlaybackStatusUpdate) {
        const interval = setInterval(() => {
          positionMillisRef.current += 500;
          onPlaybackStatusUpdate({
            isLoaded: true,
            positionMillis: positionMillisRef.current,
            isPlaying: true,
            didJustFinish: positionMillisRef.current >= 30000,
          });
          if (positionMillisRef.current >= 30000) {
            positionMillisRef.current = 0; // Loop
          }
        }, 500);
        return () => clearInterval(interval);
      }
    }, [isPlaying, onPlaybackStatusUpdate]);

    React.useImperativeHandle(ref, () => ({
      playAsync: async () => {
        setIsPlaying(true);
        return { isPlaying: true };
      },
      pauseAsync: async () => {
        setIsPlaying(false);
        return { isPlaying: false };
      },
      replayAsync: async () => {
        positionMillisRef.current = 0;
        setIsPlaying(true);
        return { isPlaying: true };
      },
      getPositionAsync: async () => {
        return { positionMillis: positionMillisRef.current };
      },
      getStatusAsync: async () => {
        return { isPlaying, positionMillis: positionMillisRef.current, isLoaded: true };
      }
    }));

    return (
      <View style={[{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={{ color: '#E5FF00', fontFamily: 'Assistant-Bold', fontSize: 16 }}>
          קדימון סנסורי פעיל (סימולציה)
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Assistant-Regular', fontSize: 12, marginTop: 8 }}>
          פידבק רטט ואיזון שמע מרחבי פעילים
        </Text>
      </View>
    );
  });
}

// Compile-time type helpers
export namespace Audio {
  export type Sound = any;
  export type Recording = any;
}

export type AVPlaybackStatus = any;

export const Audio = AudioVal;
export const Video = VideoVal;
export const ResizeMode = ResizeModeVal;
export { isAudioAvailable };
