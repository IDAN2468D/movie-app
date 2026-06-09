import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
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

    if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance?.MAX ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E5FF00',
      }).catch((err: any) => {
        console.warn('Failed to configure Android notification channel:', err);
      });
    }

    try {
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response?.notification?.request?.content?.data;
        const navigate = () => {
          try {
            if (data?.screen === 'tickets') {
              router.push('/(tabs)/tickets');
            } else if (data?.movieId) {
              router.push(`/movie/${data.movieId}`);
            }
          } catch (err) {
            console.warn('[NotificationService] Router not ready, retrying in 500ms:', err);
            setTimeout(navigate, 500);
          }
        };
        setTimeout(navigate, 150);
      });
    } catch (error) {
      console.warn('Failed to register notification response listener:', error);
    }
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
        Alert.alert(
          'התראות',
          'כדי לקבל תזכורות לסרטים וכרטיסים בזמן אמת, יש לאשר קבלת התראות בהגדרות המכשיר.',
          [{ text: 'הבנתי', style: 'cancel' }]
        );
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
  async scheduleMovieReminder(movieTitle: string, showtimeDate: Date, movieId?: number, hallName: string = 'האולם המרכזי') {
    if (!this.hasNativeSupport || !Notifications) return null;

    if (!showtimeDate || !(showtimeDate instanceof Date) || isNaN(showtimeDate.getTime())) {
      console.warn('[NotificationService] Invalid showtimeDate provided to scheduleMovieReminder.');
      return null;
    }

    // Reminder 30 minutes before
    const trigger = new Date(showtimeDate.getTime() - 30 * 60 * 1000);
    
    if (trigger < new Date() || isNaN(trigger.getTime())) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎬 הסרט שלך מתחיל בקרוב!',
        body: `הסרט "${movieTitle}" מתחיל בעוד 30 דקות באולם "${hallName}". הכינו את הפופקורן!`,
        data: { movieId, screen: 'tickets' },
        sound: true,
      },
      trigger: {
        type: 'date',
        date: trigger,
        channelId: 'default',
      } as any,
    });
  }

  /**
   * Schedule a reminder for snack delivery.
   */
  async scheduleSnackDeliveryReminder(movieTitle: string, deliveryDate: Date, hallName: string, seatRow: string, seatNumber: number) {
    if (!this.hasNativeSupport || !Notifications) return null;

    if (!deliveryDate || !(deliveryDate instanceof Date) || isNaN(deliveryDate.getTime())) {
      console.warn('[NotificationService] Invalid deliveryDate provided to scheduleSnackDeliveryReminder.');
      return null;
    }

    if (deliveryDate < new Date() || isNaN(deliveryDate.getTime())) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍿 הנשנושים שלך בדרך למושב!',
        body: `הכיבוד שלך יוצא כעת מדלפק הקיוסק ומובא ישירות למושב ${seatRow}${seatNumber} באולם "${hallName}". בתאבון!`,
        data: { screen: 'tickets' },
        sound: true,
      },
      trigger: {
        type: 'date',
        date: deliveryDate,
        channelId: 'default',
      } as any,
    });
  }

  /**
   * Notify about a new movie.
   */
  async notifyNewMovie(movieTitle: string, movieId?: number) {
    return await this.scheduleLocalNotification(
      '🎬 סרט חדש ב-CineBook!',
      `הסרט "${movieTitle}" זמין כעת לצפייה. הזמן כרטיסים עכשיו!`,
      { movieId }
    );
  }

  /**
   * Notify about a ticket purchase.
   */
  async notifyTicketPurchase(movieTitle: string, seatCount: number, movieId?: number) {
    return await this.scheduleLocalNotification(
      '✅ הרכישה הושלמה!',
      `רכשת ${seatCount} כרטיסים לסרט "${movieTitle}". תהנו!`,
      { movieId, screen: 'tickets' }
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
