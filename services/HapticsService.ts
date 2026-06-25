import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

class HapticsService {
  private lastTriggerTime = 0;
  private minIntervalMs = 80; // Minimum delay between haptic impacts

  async trigger(type: HapticType) {
    const now = Date.now();
    if (now - this.lastTriggerTime < this.minIntervalMs) {
      return;
    }
    this.lastTriggerTime = now;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
      }
    } catch (e) {
      console.warn('[HapticsService] Hardware vibration failed:', e);
    }
  }
}

export const hapticsService = new HapticsService();
export default hapticsService;
