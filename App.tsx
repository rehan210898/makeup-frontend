import React, { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
  PlayfairDisplay_900Black,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { ToastContainer } from './src/components/ui';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from './src/hooks/useNotifications';
import { COLORS } from './src/constants';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Step 11: Global default staleTime of 2 min; per-query overrides applied in individual hooks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2,      // 2 minutes default staleTime
      gcTime: 1000 * 60 * 30,         // 30 minutes before unused cache is garbage collected
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function AppContent() {
  // Initialize notifications
  useNotifications();
  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    // Plus Jakarta Sans
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    // Playfair Display
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium_Italic,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold_Italic,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    // Keep native splash screen visible while fonts load
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AppContent />
            <ToastContainer />
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSubtle,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.primary,
  },
});
