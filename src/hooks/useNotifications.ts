import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';
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

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as any;
    console.log('Notification tapped, data:', JSON.stringify(data));

    if (!data) return;

    // Priority 1: Direct deep link URL
    if (data.click_action) {
      try { Linking.openURL(data.click_action); } catch (e) { console.error('Failed to open deep link:', e); }
      return;
    }

    // Priority 2: Screen-based navigation (campaign notifications)
    if (data.screen) {
      const screenName = SCREEN_MAP[data.screen] || data.screen;
      const params = data.params || {};

      try {
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
      } catch (navError) {
        console.error('Navigation from notification failed:', navError);
      }
      return;
    }

    // Priority 3: Typed notification payloads (order updates, promotions)
    try {
      if (data.type === 'PROMOTION' && data.link) {
        try { Linking.openURL(Linking.createURL(data.link)); } catch (e) { console.error('Failed to open promotion link:', e); }
      } else if (data.type === 'ORDER_UPDATE' || data.type === 'ORDER_CONFIRMATION') {
        if (data.orderId) {
          navigate('OrderTracking', { orderId: data.orderId });
        }
      } else if (data.type === 'PRODUCT_RESTOCK' && data.productId) {
        navigate('ProductDetail', { productId: data.productId });
      }
    } catch (navError) {
      console.error('Navigation from typed notification failed:', navError);
    }
  }, []);

  useEffect(() => {
    // Skip push registration in Expo Go (tokens won't work for real push)
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
      console.log('Running in Expo Go - push notifications limited to local only');
    }

    // Register for push notifications
    NotificationService.registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        NotificationService.registerTokenWithBackend(token);
      }
    });

    // Listen for notifications received while app is in foreground
    notificationListener.current = NotificationService.addNotificationReceivedListener(
      notif => setNotification(notif)
    );

    // Listen for user tapping on a notification
    responseListener.current = NotificationService.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Check if app was opened by a notification (Cold Start)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        // Small delay to ensure navigation is ready
        setTimeout(() => handleNotificationResponse(response), 500);
      }
    });

    return () => {
      if (notificationListener.current) {
        NotificationService.removeSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        NotificationService.removeSubscription(responseListener.current);
      }
    };
  }, [handleNotificationResponse]);

  return {
    expoPushToken,
    notification,
  };
};
