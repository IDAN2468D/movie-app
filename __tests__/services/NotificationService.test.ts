import * as Notifications from 'expo-notifications';
import NotificationService from '../../services/NotificationService';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'expo-token' })),
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: {
    MAX: 4,
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register for push notifications correctly', async () => {
    const success = await NotificationService.requestPermissions();
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    expect(success).toBe(true);
  });

  it('should schedule a new movie notification', async () => {
    await NotificationService.notifyNewMovie('Inception');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('סרט חדש'),
          body: expect.stringContaining('Inception'),
        }),
      })
    );
  });

  it('should schedule a ticket purchase notification', async () => {
    await NotificationService.notifyTicketPurchase('Inception', 2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('הרכישה הושלמה'),
          body: expect.stringContaining('2 כרטיסים'),
        }),
      })
    );
  });
});
