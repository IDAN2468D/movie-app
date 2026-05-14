import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  /**
   * Initialize the notification system
   */
  static async initHandler() {
    if (!Device.isDevice) {
      console.log('NotificationService: Must use physical device for Push Notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('NotificationService: Failed to get push token for push notification!');
        return;
      }

      // Android specific channel configuration
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('NotificationService: Initialized successfully');
    } catch (error) {
      console.error('NotificationService: Initialization error', error);
    }
  }

  /**
   * Register for push notifications and get the token
   */
  static async registerForPushNotificationsAsync() {
    if (!Device.isDevice) return null;

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('NotificationService: Project ID not found in config');
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      console.log('NotificationService: Push Token generated', token);
      return token;
    } catch (error) {
      console.error('NotificationService: Registration error', error);
      return null;
    }
  }

  /**
   * Send a local notification for a new movie release
   */
  static async notifyNewMovie(movieTitle: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "סרט חדש ב-CineBook! 🍿",
          body: `הסרט "${movieTitle}" זמין כעת להזמנה.`,
          data: { movieTitle },
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('NotificationService: notifyNewMovie error', error);
    }
  }

  /**
   * Send a local notification after ticket purchase simulating email
   */
  static async notifyTicketPurchase(movieTitle: string, seatCount: number) {
    try {
      // General app notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "ההזמנה בוצעה בהצלחה! 🎬",
          body: `הזמנת ${seatCount} מושבים לסרט "${movieTitle}". הכרטיסים מחכים לך באפליקציה.`,
          data: { type: 'purchase', movieTitle },
          sound: 'default',
        },
        trigger: null,
      });

      // Simulated Email notification with barcode/QR mention
      setTimeout(async () => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📧 קבלה והכרטיס הדיגיטלי שלך",
            body: `שלום! מצורף הכרטיס והברקוד/QR לסרט "${movieTitle}". ניתן לסרוק אותו ישירות מהמייל או מהאפליקציה.`,
            data: { type: 'email', movieTitle, hasQR: true },
            sound: 'default',
          },
          trigger: null,
        });
      }, 3000);
    } catch (error) {
      console.error('NotificationService: notifyTicketPurchase error', error);
    }
  }

  /**
   * Schedule a reminder for an upcoming showtime
   */
  static async scheduleShowtimeReminder(movieTitle: string, date: Date) {
    try {
      // Schedule 30 minutes before
      const trigger = new Date(date);
      trigger.setMinutes(trigger.getMinutes() - 30);

      // If the reminder time is in the past, don't schedule
      if (trigger <= new Date()) {
        console.log('NotificationService: Showtime reminder skipped (time in past)');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "מתחילים עוד מעט! 🍿",
          body: `הסרט "${movieTitle}" יתחיל בעוד חצי שעה.`,
          data: { type: 'reminder', movieTitle },
          sound: 'default',
        },
        trigger: {
          date: trigger,
          type: 'date',
        } as any,
      });
      
      console.log('NotificationService: Showtime reminder scheduled');
    } catch (error) {
      console.error('NotificationService: scheduleShowtimeReminder error', error);
    }
  }

  /**
   * Send a local notification for special sales and discounts
   */
  static async notifyPromoDeals() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "מבצעים והנחות ב-CineBook! 🎟️",
          body: "יש לנו כמה הטבות בלעדיות עבורך. בדוק את רשימת המבצעים עכשיו!",
          data: { type: 'promo' },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('NotificationService: notifyPromoDeals error', error);
    }
  }
}
