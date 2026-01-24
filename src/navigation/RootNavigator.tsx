import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './types';
import BottomTabNavigator from './BottomTabNavigator';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import OrderHistoryScreen from '../screens/orders/OrderHistoryScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';
import RefundScreen from '../screens/orders/RefundScreen';
import WishlistScreen from '../screens/profile/WishlistScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

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
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Refund" component={RefundScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="Address" component={AddressScreen} />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen} 
          options={{ headerShown: true, title: 'Personal Details' }} 
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen} 
          options={{ headerShown: true, title: 'Change Password' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
