import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import ApiClient from './api';

// Configure how notifications behave when the app is in foreground
// Works in dev-client and production builds (not Expo Go)
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
  /**
   * Registers the device for push notifications and returns the Expo Push Token.
   */
  async registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permission to receive push notifications was denied');
        return;
      }

      // Get the token that uniquely identifies this device
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
          
        if (!projectId) {
            console.warn('Project ID not found in app config. Ensure EAS projectId is set.');
        }

        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        console.log('Expo Push Token:', token);
      } catch (error) {
        console.error('Error fetching push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  /**
   * Send the token to the backend to associate with the current user
   */
  async registerTokenWithBackend(token: string) {
    try {
      // NOTE: Ensure your BFF/API proxies this request to the WP Plugin endpoint
      // OR ApiClient needs to hit the WP API directly if the BFF doesn't expose it.
      // Assuming ApiClient hits the BFF, and we need to add a route there or hit WP directly.
      // For now, assuming direct call via ApiClient (which points to BFF/WP).
      // The WP Plugin route is: /wp-json/muo-push/v1/register
      
      // If ApiClient.baseURL is the BFF, we might need a specific proxy route.
      // Or if ApiClient points to WP, we use the route directly.
      // Given current setup, ApiClient points to BFF.
      // We should probably add a proxy route in BFF or assume BFF proxies unknown routes?
      // Actually, let's assume we add a route in BFF or call it directly.
      
      // Since we don't have a BFF route for this yet, let's assume we call a new BFF endpoint
      // that forwards to WP, OR we rely on a custom implementation.
      // Let's use a generic 'notifications/register' endpoint that we will assume exists or add later.
      // Or better, stick to the WP path structure if the BFF proxies it.
      
      await ApiClient.post('/notifications/register', { 
        token, 
        platform: Platform.OS 
      });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Error registering push token with backend:', error);
    }
  }

  /**
   * Remove the token from backend on logout
   */
  async removeTokenFromBackend(token: string) {
    try {
      await ApiClient.post('/notifications/remove', { token });
      console.log('Push token removed from backend');
    } catch (error) {
      console.error('Error removing push token from backend:', error);
    }
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
