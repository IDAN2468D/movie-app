/* eslint-disable @typescript-eslint/no-unused-vars */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { Notifications } from '../utils/SafeModules';

/**
 * Service to handle local and push notifications safely.
 * Uses SafeModules to prevent crashes on environments without native notification support.
 */
class NotificationService {
  private hasNativeSupport = !!Notifications;

  constructor() {
    if (this.hasNativeSupport) {
      this.configureNotifications();
    } else {
      console.warn('NotificationService: Native notifications not supported in this environment.');
    }
  }

  private configureNotifications() {
    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Backward compatibility alias for initialization
   */
  initHandler() {
    this.configureNotifications();
  }

  /**
   * Request permissions for notifications.
   * Returns true if granted, false otherwise.
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.hasNativeSupport || !Notifications) return false;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      
      return true;
    } else {
      console.log('Must use physical device for Push Notifications');
      return false;
    }
  }

  /**
   * Get the Expo Push Token.
   */
  async getPushToken(): Promise<string | null> {
    if (!this.hasNativeSupport || !Notifications) return null;

    try {
      if (Device.isDevice) {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        return token;
      }
    } catch (error) {
      console.warn('Error getting push token:', error);
    }
    return null;
  }

  /**
   * Schedule a local notification.
   */
  async scheduleLocalNotification(title: string, body: string, data: any = {}) {
    if (!this.hasNativeSupport || !Notifications) {
      console.log('Mock Notification:', { title, body, data });
      return null;
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // immediate
    });
  }

  /**
   * Schedule a reminder for a movie.
   */
  async scheduleMovieReminder(movieTitle: string, showtime: Date) {
    if (!this.hasNativeSupport || !Notifications) return null;

    // Reminder 30 minutes before
    const trigger = new Date(showtime.getTime() - 30 * 60000);
    
    if (trigger < new Date()) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎬 Movie Starting Soon!',
        body: `"${movieTitle}" starts in 30 minutes. Get your popcorn ready!`,
        data: { movieTitle },
      },
      trigger,
    });
  }

  /**
   * Notify about a new movie.
   */
  async notifyNewMovie(movieTitle: string) {
    return await this.scheduleLocalNotification(
      '🎬 סרט חדש ב-CineBook!',
      `הסרט "${movieTitle}" זמין כעת לצפייה. הזמן כרטיסים עכשיו!`
    );
  }

  /**
   * Notify about a ticket purchase.
   */
  async notifyTicketPurchase(movieTitle: string, seatCount: number) {
    return await this.scheduleLocalNotification(
      '✅ הרכישה הושלמה!',
      `רכשת ${seatCount} כרטיסים לסרט "${movieTitle}". תהנו!`
    );
  }

  /**
   * Notify about promo deals.
   */
  async notifyPromoDeals() {
    return await this.scheduleLocalNotification(
      '🎁 הטבה מיוחדת מחכה לך!',
      'בדוק את המבצעים החדשים שלנו על פופקורן ושתייה!'
    );
  }

  /**
   * Compatibility alias for push registration
   */
  async registerForPushNotificationsAsync() {
    return await this.requestPermissions();
  }

  /**
   * Cancel all notifications.
   */
  async cancelAll() {
    if (!this.hasNativeSupport || !Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();
