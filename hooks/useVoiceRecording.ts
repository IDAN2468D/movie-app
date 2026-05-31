import { useState, useCallback, useRef } from 'react';
import { Audio, isAudioAvailable } from '@/utils/safeExpoAv';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return null;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (uri) {
        // Expo Go/Mock Mode Bypass: If audio is mock, return simulated base64 string
        if (!isAudioAvailable || uri.includes('mock-')) {
          console.log('[useVoiceRecording] Mock audio recording detected. Returning simulated base64 audio data.');
          return 'MOCK_BASE64_VOICE_DATA';
        }

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64'
        });
        return base64;
      }
      return null;
    } catch (err) {
      console.error('Failed to stop recording', err);
      return null;
    } finally {
      recordingRef.current = null;
    }
  }, []);

  return {
    isRecording,
    recordingUri,
    startRecording,
    stopRecording,
  };
};
