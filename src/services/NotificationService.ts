import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import ApiClient from './api';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private registeredToken: string | null = null;
  private registrationRetryCount = 0;
  private maxRetries = 3;

  /**
   * Registers the device for push notifications and returns the Expo Push Token.
   */
  async registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token: string | undefined;

    // Set up Android notification channel (required for Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return undefined;
    }

    // Check and request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return undefined;
    }

    // Get the Expo push token
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn('EAS projectId not found in app config');
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushToken.data;
      this.registeredToken = token;
      console.log('Expo Push Token:', token);
    } catch (error: any) {
      console.error('Failed to get push token:', error.message || error);
    }

    return token;
  }

  /**
   * Send the token to the backend with retry logic
   */
  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      await ApiClient.post('/notifications/register', {
        token,
        platform: Platform.OS,
      });
      this.registrationRetryCount = 0;
      console.log('Push token registered with backend');
      return true;
    } catch (error: any) {
      console.error('Failed to register token with backend:', error.message || error);

      // Retry with exponential backoff
      if (this.registrationRetryCount < this.maxRetries) {
        this.registrationRetryCount++;
        const delay = Math.pow(2, this.registrationRetryCount) * 1000;
        console.log(`Retrying token registration in ${delay}ms (attempt ${this.registrationRetryCount})`);
        setTimeout(() => this.registerTokenWithBackend(token), delay);
      }
      return false;
    }
  }

  /**
   * Remove the token from backend on logout
   */
  async removeTokenFromBackend(token?: string): Promise<void> {
    const tokenToRemove = token || this.registeredToken;
    if (!tokenToRemove) return;

    try {
      await ApiClient.post('/notifications/remove', { token: tokenToRemove });
      this.registeredToken = null;
      console.log('Push token removed from backend');
    } catch (error: any) {
      console.error('Failed to remove push token:', error.message || error);
    }
  }

  /**
   * Get the currently registered token
   */
  getRegisteredToken(): string | null {
    return this.registeredToken;
  }

  /**
   * Adds a listener for incoming notifications (foreground)
   */
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Adds a listener for when a user taps on a notification
   */
  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Remove specific listener
   */
  removeSubscription(subscription: Notifications.Subscription) {
    subscription.remove();
  }
}

export default new NotificationService();
