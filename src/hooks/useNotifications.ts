import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import NotificationService from '../services/NotificationService';
import { NotificationPayload } from '../types/NotificationTypes';

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
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
      } else if (data.type === 'ORDER_UPDATE' || data.type === 'ORDER_CONFIRMATION') {
        if (data.orderId) {
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
