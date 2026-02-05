import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import NotificationService from '../services/NotificationService';
import { NotificationPayload } from '../types/NotificationTypes';

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Check if running in Expo Go
    // if (Constants.appOwnership === 'expo') {
    //   console.log('⚠️ Push Notifications disabled in Expo Go');
    //   return;
    // }

    // 1. Register for push notifications on mount
    NotificationService.registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        NotificationService.registerTokenWithBackend(token);
      }
    });

    // 2. Listen for notifications received while app is foregrounded
    notificationListener.current = NotificationService.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // 3. Listen for user interaction (tapping the notification)
    responseListener.current = NotificationService.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as unknown as NotificationPayload;
      console.log('Notification Data:', data);

      // Handle Deep Linking via 'click_action' or construct it from data
      if (data.click_action) {
        Linking.openURL(data.click_action);
      } else if (data.type === 'PROMOTION' && (data as any).link) {
        Linking.openURL(Linking.createURL((data as any).link));
      } else if (data.type === 'ORDER_UPDATE' || data.type === 'ORDER_CONFIRMATION') {
        if ('orderId' in data && data.orderId) {
            Linking.openURL(Linking.createURL(`orders/${data.orderId}`));
        }
      }
    });

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        NotificationService.removeSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        NotificationService.removeSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification
  };
};
