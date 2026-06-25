import { hapticsService, HapticType } from './HapticsService';
import { SharedValue, withSequence, withTiming } from 'react-native-reanimated';

export interface SyncEvent {
  timeMs: number;
  type: HapticType;
  triggered?: boolean;
}

export class SyncEngine {
  private timeline: SyncEvent[] = [];
  private currentIndex = 0;
  private isRunning = false;
  private videoRef: any = null;
  private rafId: number | null = null;
  private onTriggerCallback: ((event: SyncEvent) => void) | null = null;

  // Visual Reanimated Shared Values
  private glowIntensity: SharedValue<number> | null = null;
  private shakeIntensity: SharedValue<number> | null = null;

  constructor(timeline: SyncEvent[] = []) {
    this.setTimeline(timeline);
  }

  setTimeline(timeline: SyncEvent[]) {
    // Ensure timeline is sorted by timestamp and reset triggers
    this.timeline = [...timeline]
      .sort((a, b) => a.timeMs - b.timeMs)
      .map(e => ({ ...e, triggered: false }));
    this.currentIndex = 0;
  }

  bindVideo(videoRef: any) {
    this.videoRef = videoRef;
  }

  bindSharedValues(glowIntensity: SharedValue<number>, shakeIntensity: SharedValue<number>) {
    this.glowIntensity = glowIntensity;
    this.shakeIntensity = shakeIntensity;
  }

  registerCallback(callback: (event: SyncEvent) => void) {
    this.onTriggerCallback = callback;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.runLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset() {
    this.currentIndex = 0;
    this.timeline = this.timeline.map(e => ({ ...e, triggered: false }));
  }

  private async runLoop() {
    if (!this.isRunning) return;

    if (this.videoRef) {
      try {
        // Query position via Video ref
        const status = await this.videoRef.getPositionAsync();
        if (status && typeof status.positionMillis === 'number') {
          this.checkEvents(status.positionMillis);
        }
      } catch (err) {
        // Fail-silent for safety
      }
    }

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(() => this.runLoop());
    }
  }

  checkEvents(currentMs: number) {
    // Reset index if video looped backwards (e.g. replayed)
    if (
      this.currentIndex > 0 && 
      this.timeline[this.currentIndex - 1] && 
      currentMs < this.timeline[this.currentIndex - 1].timeMs - 1000
    ) {
      this.reset();
    }

    // Trigger any events whose timestamp has been reached
    while (
      this.currentIndex < this.timeline.length &&
      currentMs >= this.timeline[this.currentIndex].timeMs
    ) {
      const event = this.timeline[this.currentIndex];
      if (!event.triggered) {
        event.triggered = true;
        this.triggerEvent(event);
      }
      this.currentIndex++;
    }
  }

  private triggerEvent(event: SyncEvent) {
    // 1. Fire hardware haptics
    hapticsService.trigger(event.type);

    // 2. Direct visual updates on the UI thread via Reanimated
    if (this.glowIntensity && this.shakeIntensity) {
      // Glow overlay bump with timing decay
      this.glowIntensity.value = withSequence(
        withTiming(1.0, { duration: 80 }),
        withTiming(0.0, { duration: 400 })
      );
      
      // Screen shake displacement sequence based on strength
      let shakeAmt = 0;
      if (event.type === 'heavy') shakeAmt = 16;
      else if (event.type === 'medium') shakeAmt = 9;
      else if (event.type === 'light') shakeAmt = 4;
      else shakeAmt = 6; // Success / Warning

      this.shakeIntensity.value = withSequence(
        withTiming(-shakeAmt, { duration: 50 }),
        withTiming(shakeAmt, { duration: 50 }),
        withTiming(-shakeAmt / 2, { duration: 50 }),
        withTiming(0, { duration: 100 })
      );
    }

    // 3. Notify UI/screen listeners
    if (this.onTriggerCallback) {
      this.onTriggerCallback(event);
    }
  }
}
export default SyncEngine;
