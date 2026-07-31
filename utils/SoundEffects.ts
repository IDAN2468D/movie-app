import { Audio } from './safeExpoAv';
import * as Haptics from 'expo-haptics';

function generateStereoWavBase64(frequency: number, durationSec: number, pan: number): string {
  const sampleRate = 22050;
  const numChannels = 2;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const leftVol = Math.max(0, Math.min(1, (1 - pan) / 2));
  const rightVol = Math.max(0, Math.min(1, (1 + pan) / 2));

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.sin(2 * Math.PI * frequency * t);
    const decay = Math.exp(-6 * (i / numSamples));
    
    const leftSample = Math.floor(sampleVal * decay * leftVol * 32767);
    const rightSample = Math.floor(sampleVal * decay * rightVol * 32767);

    view.setInt16(offset, leftSample, true);
    view.setInt16(offset + 2, rightSample, true);
    offset += 4;
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof btoa === 'function') {
    return 'data:audio/wav;base64,' + btoa(binary);
  }
  return '';
}

export async function playSpatialTone(frequency: number, pan: number = 0) {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wavUri = generateStereoWavBase64(frequency, 0.35, pan);
    if (!wavUri) return;

    const { sound } = await Audio.Sound.createAsync(
      { uri: wavUri },
      { shouldPlay: true, volume: 1.0 }
    );
    
    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, 500);
  } catch (e) {
    console.warn('[SoundEffects] Playback warning:', e);
  }
}

export async function playLeftSpeakerSound() {
  await playSpatialTone(600, -0.9);
}

export async function playRightSpeakerSound() {
  await playSpatialTone(600, 0.9);
}

export async function playCenterSubBass() {
  await playSpatialTone(70, 0.0);
}

function generateChimeWavBase64(frequencies: number[], durationSec: number = 0.24, pan: number = 0): string {
  const sampleRate = 22050;
  const numChannels = 2;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const leftVol = Math.max(0, Math.min(1, (1 - pan) / 2));
  const rightVol = Math.max(0, Math.min(1, (1 + pan) / 2));

  const noteDurationSamples = Math.floor(numSamples / frequencies.length);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const noteIdx = Math.min(Math.floor(i / noteDurationSamples), frequencies.length - 1);
    const freq = frequencies[noteIdx];
    const notePos = (i % noteDurationSamples) / noteDurationSamples;

    const t = i / sampleRate;
    const sampleVal = 0.75 * Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t);
    const decay = Math.exp(-5 * notePos);

    const leftSample = Math.floor(sampleVal * decay * leftVol * 28000);
    const rightSample = Math.floor(sampleVal * decay * rightVol * 28000);

    view.setInt16(offset, leftSample, true);
    view.setInt16(offset + 2, rightSample, true);
    offset += 4;
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof btoa === 'function') {
    return 'data:audio/wav;base64,' + btoa(binary);
  }
  return '';
}

/**
 * Plays a cute ascending 3-note chime when tapping or entering a movie screen.
 */
export async function playCuteMovieClickSound() {
  try {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // Ascending bright chime notes: E5 (659.25Hz), G#5 (830.61Hz), B5 (987.77Hz)
    const wavUri = generateChimeWavBase64([659.25, 830.61, 987.77], 0.24, 0);
    if (!wavUri) return;

    const { sound } = await Audio.Sound.createAsync(
      { uri: wavUri },
      { shouldPlay: true, volume: 0.85 }
    );

    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, 500);
  } catch (e) {
    console.warn('[SoundEffects] Cute movie click sound playback warning:', e);
  }
}

