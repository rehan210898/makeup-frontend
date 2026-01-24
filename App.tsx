import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from './src/hooks/useNotifications';

const queryClient = new QueryClient();

function AppContent() {
  // Initialize notifications
  useNotifications();
  return <RootNavigator />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toast />
    </QueryClientProvider>
  );
}