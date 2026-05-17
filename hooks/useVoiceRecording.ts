import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
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
        // Use the new Expo SDK 54+ File API
        const file = new File(uri);
        const base64 = await file.base64();
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
