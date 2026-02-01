import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😕</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}
            <Pressable style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>😕</Text>
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>
        We're sorry, but something unexpected happened. Please try again.
      </Text>
      {__DEV__ && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorTitle}>Error Details:</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}
      <Pressable style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  </View>
);

// Screen-level error component (for API errors, empty states, etc.)
interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading. Please try again.',
  onRetry,
  retryLabel = 'Retry',
}) => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenEmoji}>😕</Text>
    <Text style={styles.screenTitle}>{title}</Text>
    <Text style={styles.screenMessage}>{message}</Text>
    {onRetry && (
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>{retryLabel}</Text>
      </Pressable>
    )}
  </View>
);

// Empty state component
interface EmptyStateProps {
  title?: string;
  message?: string;
  emoji?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  message = 'Check back later for updates.',
  emoji = '📭',
  action,
}) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>{emoji}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {action && (
      <Pressable style={styles.actionButton} onPress={action.onPress}>
        <Text style={styles.actionButtonText}>{action.label}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    backgroundColor: COLORS.gray[100],
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  screenEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  screenMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 260,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
