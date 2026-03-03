import React, { Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import { COLORS } from '../constants';

// Eager-loaded screens (critical path)
import BottomTabNavigator from './BottomTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import ProductListScreen from '../screens/products/ProductListScreen';

// Step 10: Lazy-loaded screens
const LoginScreen = React.lazy(() => import('../screens/auth/LoginScreen'));
const RegisterScreen = React.lazy(() => import('../screens/auth/RegisterScreen'));
const VerifyEmailScreen = React.lazy(() => import('../screens/auth/VerifyEmailScreen'));
const CheckoutScreen = React.lazy(() => import('../screens/cart/CheckoutScreen'));
const OrderHistoryScreen = React.lazy(() => import('../screens/orders/OrderHistoryScreen'));
const OrderTrackingScreen = React.lazy(() => import('../screens/orders/OrderTrackingScreen'));
const RefundScreen = React.lazy(() => import('../screens/orders/RefundScreen'));
const WishlistScreen = React.lazy(() => import('../screens/profile/WishlistScreen'));
const AddressScreen = React.lazy(() => import('../screens/profile/AddressScreen'));
const EditProfileScreen = React.lazy(() => import('../screens/profile/EditProfileScreen'));
const ChangePasswordScreen = React.lazy(() => import('../screens/profile/ChangePasswordScreen'));

function LazyFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

// Wrap lazy component in Suspense
function withSuspense<P extends object>(LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

const LazyLogin = withSuspense(LoginScreen);
const LazyRegister = withSuspense(RegisterScreen);
const LazyVerifyEmail = withSuspense(VerifyEmailScreen);
const LazyCheckout = withSuspense(CheckoutScreen);
const LazyOrderHistory = withSuspense(OrderHistoryScreen);
const LazyOrderTracking = withSuspense(OrderTrackingScreen);
const LazyRefund = withSuspense(RefundScreen);
const LazyWishlist = withSuspense(WishlistScreen);
const LazyAddress = withSuspense(AddressScreen);
const LazyEditProfile = withSuspense(EditProfileScreen);
const LazyChangePassword = withSuspense(ChangePasswordScreen);

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'muoapp://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      VerifyEmail: {
        path: 'auth/verify',
        parse: {
          token: (token: string) => token,
          email: (email: string) => email,
        },
      },
      // Handle Google Callback
      // muoapp://auth-callback?token=...
      MainTabs: 'main',
    },
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="MainTabs"
          component={BottomTabNavigator}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ animation: 'fade_from_bottom', animationDuration: 250 }}
        />
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen
          name="Login"
          component={LazyLogin}
          options={{ animation: 'fade_from_bottom', animationDuration: 300 }}
        />
        <Stack.Screen name="Register" component={LazyRegister} />
        <Stack.Screen
          name="VerifyEmail"
          component={LazyVerifyEmail}
          options={{ animation: 'fade_from_bottom', animationDuration: 250 }}
        />
        <Stack.Screen
          name="Checkout"
          component={LazyCheckout}
          options={{ animation: 'slide_from_bottom', animationDuration: 300 }}
        />
        <Stack.Screen name="OrderHistory" component={LazyOrderHistory} />
        <Stack.Screen name="OrderTracking" component={LazyOrderTracking} />
        <Stack.Screen
          name="Refund"
          component={LazyRefund}
          options={{ animation: 'fade_from_bottom', animationDuration: 250 }}
        />
        <Stack.Screen name="Wishlist" component={LazyWishlist} />
        <Stack.Screen name="Address" component={LazyAddress} />
        <Stack.Screen name="EditProfile" component={LazyEditProfile} />
        <Stack.Screen name="ChangePassword" component={LazyChangePassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
