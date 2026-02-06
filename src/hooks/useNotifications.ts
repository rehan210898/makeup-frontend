import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import NotificationService from '../services/NotificationService';
import { navigate } from '../navigation/navigationRef';

// Screen name mapping from campaign config names to actual navigation screen names
const SCREEN_MAP: Record<string, string> = {
  'Category': 'ProductList',
  'ProductList': 'ProductList',
  'ProductDetail': 'ProductDetail',
  'OrderTracking': 'OrderTracking',
  'OrderHistory': 'OrderHistory',
  'Home': 'MainTabs',
};

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Push notifications don't work in Expo Go - skip registration
    if (Constants.appOwnership === 'expo') {
      console.log('Push Notifications disabled in Expo Go. Use dev-client build for testing.');
      return;
    }

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
      const data = response.notification.request.content.data as any;
      console.log('Notification Data:', data);

      // Priority 1: Direct deep link URL
      if (data.click_action) {
        Linking.openURL(data.click_action);
        return;
      }

      // Priority 2: Screen-based navigation (campaign notifications)
      if (data.screen) {
        const screenName = SCREEN_MAP[data.screen] || data.screen;
        const params = data.params || {};

        // Map campaign param names to navigation param names
        if (screenName === 'ProductList' && params.categoryId) {
          navigate('ProductList', {
            categoryId: params.categoryId,
            categoryName: params.name || params.categoryName || '',
          });
        } else if (screenName === 'ProductDetail' && params.productId) {
          navigate('ProductDetail', { productId: params.productId });
        } else if (screenName === 'OrderTracking' && params.orderId) {
          navigate('OrderTracking', { orderId: params.orderId });
        } else {
          navigate(screenName as any, params);
        }
        return;
      }

      // Priority 3: Typed notification payloads (order updates, promotions)
      if (data.type === 'PROMOTION' && data.link) {
        Linking.openURL(Linking.createURL(data.link));
      } else if (data.type === 'ORDER_UPDATE' || data.type === 'ORDER_CONFIRMATION') {
        if (data.orderId) {
          navigate('OrderTracking', { orderId: data.orderId });
        }
      } else if (data.type === 'PRODUCT_RESTOCK' && data.productId) {
        navigate('ProductDetail', { productId: data.productId });
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
