import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Queued navigation for cold start — processed after splash screen completes
let pendingNavigation: { name: keyof RootStackParamList; params?: any } | null = null;

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    // Queue the navigation — will be processed after splash screen resets
    pendingNavigation = { name, params };
  }
}

export function processPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    const { name, params } = pendingNavigation;
    pendingNavigation = null;
    // Short delay to let the reset settle before navigating
    setTimeout(() => {
      navigationRef.navigate(name, params);
    }, 100);
  }
}

export function hasPendingNavigation() {
  return pendingNavigation !== null;
}
