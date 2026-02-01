import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SplashScreenExpo from 'expo-splash-screen';
import { COLORS } from '../constants';
import { RootStackParamList } from '../navigation/types';
import { useUserStore } from '../store/userStore';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Keep the splash screen visible while we check auth
SplashScreenExpo.preventAutoHideAsync().catch(() => {});

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { isAuthenticated, token, user, _hasHydrated } = useUserStore();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for zustand to hydrate from secure storage
      if (!_hasHydrated) return;

      try {
        // Small delay for splash screen visibility
        await new Promise(resolve => setTimeout(resolve, 300));

        // Hide native splash screen
        await SplashScreenExpo.hideAsync();

        // Navigate based on auth state
        if (isAuthenticated && token && user) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await SplashScreenExpo.hideAsync();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    checkAuth();
  }, [_hasHydrated, isAuthenticated, token, user, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MakeupOcean</Text>
          <Text style={styles.tagline}>Beauty at your fingertips</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  },
});
