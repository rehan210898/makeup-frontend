import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { useToastStore, Toast as ToastType, ToastType as ToastVariant } from '../../store/toastStore';
import { haptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - 32;

const ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const COLORS_MAP: Record<ToastVariant, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'rgba(34, 197, 94, 0.15)',
    icon: '#22c55e',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    icon: '#ef4444',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    icon: '#3b82f6',
    border: 'rgba(59, 130, 246, 0.3)',
  },
};

interface ToastItemProps {
  toast: ToastType;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const colors = COLORS_MAP[toast.type];

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      opacity.value = 1 - Math.abs(event.translationX) / (TOAST_WIDTH / 2);
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > TOAST_WIDTH / 3) {
        translateX.value = withTiming(
          event.translationX > 0 ? TOAST_WIDTH : -TOAST_WIDTH,
          { duration: 200 },
          () => {
            runOnJS(onDismiss)();
          }
        );
      } else {
        translateX.value = withSpring(0);
        opacity.value = withTiming(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    haptic.light();
  }, []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.toastContainer, animatedStyle]}
        entering={SlideInUp.springify().damping(15)}
        exiting={FadeOut.duration(200)}
      >
        <BlurView intensity={80} tint="light" style={styles.blurView}>
          <View style={[styles.toastContent, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.icon }]}>
              <Text style={styles.icon}>{ICONS[toast.type]}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
              {toast.message && (
                <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
              )}
            </View>
            <Pressable onPress={onDismiss} hitSlop={10} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>
    </GestureDetector>
  );
};

export const ToastContainer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toastContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  blurView: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  message: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color: COLORS.gray[400],
  },
});

export default ToastContainer;
