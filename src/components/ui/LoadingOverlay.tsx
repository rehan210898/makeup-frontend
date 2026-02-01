import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = true,
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      scale.value = 1;
    }
  }, [visible, rotation, scale]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {transparent ? (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.solidBackground]} />
        )}
        <View style={styles.content}>
          <Animated.View style={[styles.spinner, spinnerStyle]}>
            <View style={styles.spinnerRing} />
          </Animated.View>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

// Inline loading indicator for buttons, lists, etc.
interface InlineLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  label?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'medium',
  color = COLORS.primary,
  label,
}) => {
  const sizes = {
    small: 16,
    medium: 24,
    large: 36,
  };

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size={sizes[size] > 24 ? 'large' : 'small'} color={color} />
      {label && <Text style={[styles.inlineLabel, { color }]}>{label}</Text>}
    </View>
  );
};

// Pull to refresh loading indicator
interface RefreshLoaderProps {
  refreshing: boolean;
}

export const RefreshLoader: React.FC<RefreshLoaderProps> = ({ refreshing }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (refreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [refreshing, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!refreshing) return null;

  return (
    <View style={styles.refreshContainer}>
      <Animated.View style={[styles.refreshSpinner, animatedStyle]}>
        <View style={styles.refreshRing} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solidBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  spinner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: COLORS.white,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  inlineLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  refreshContainer: {
    padding: 16,
    alignItems: 'center',
  },
  refreshSpinner: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.gray[200],
    borderTopColor: COLORS.primary,
  },
});

export default LoadingOverlay;
