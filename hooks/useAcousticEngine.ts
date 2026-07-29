import { useEffect, useRef, useCallback } from 'react';

/**
 * Web Audio API Acoustic Spatializer Engine
 * Zero external audio assets. Programmatic synthesis with 120Hz reactivity.
 */
export function useAcousticEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    return audioCtxRef.current;
  }, []);

  /**
   * 1. Sub-bass Drop (40Hz): Deep sine wave trigger for locks / confirmations
   */
  const playSubBass = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(40, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      if (analyserRef.current) {
        osc.connect(gain);
        gain.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn('[AcousticEngine] SubBass failed:', e);
    }
  }, [getAudioContext]);

  /**
   * 2. Spatial Matrix Click: Dynamic click with 800Hz->100Hz sweep and X-axis panning
   */
  const playSpatialClick = useCallback((event?: any) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Frequency drop: 800Hz to 100Hz over 0.08 seconds
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      // Stereophonic Panning (-1.0 left to +1.0 right)
      let panValue = 0;
      if (typeof window !== 'undefined' && window.innerWidth > 0 && event) {
        const clientX = event.clientX ?? event.nativeEvent?.pageX ?? (window.innerWidth / 2);
        panValue = Math.max(-1, Math.min(1, (clientX / window.innerWidth) * 2 - 1));
      }

      let lastNode: AudioNode = gain;
      if (typeof (ctx as any).createStereoPanner === 'function') {
        const panner = (ctx as any).createStereoPanner();
        panner.pan.setValueAtTime(panValue, ctx.currentTime);
        gain.connect(panner);
        lastNode = panner;
      }

      if (analyserRef.current) {
        lastNode.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } else {
        lastNode.connect(ctx.destination);
      }

      osc.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn('[AcousticEngine] SpatialClick failed:', e);
    }
  }, [getAudioContext]);

  /**
   * Hard Cleanup Rule: Close AudioContext & cancel speechSynthesis on unmount
   */
  const cleanupAudio = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close().catch(() => {});
      } catch (e) {}
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    playSubBass,
    playSpatialClick,
    cleanupAudio,
    analyserNode: analyserRef.current,
  };
}

export default useAcousticEngine;
