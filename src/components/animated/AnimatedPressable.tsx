import React, { useCallback } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { haptic } from '../../utils/haptics';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  scaleDown?: number;
  disabled?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  scaleDown = 0.97,
  disabled = false,
  hapticFeedback = 'light',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback === 'none') return;
    haptic[hapticFeedback]();
  }, [hapticFeedback]);

  const handlePress = useCallback(() => {
    triggerHaptic();
    onPress();
  }, [onPress, triggerHaptic]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      haptic.heavy();
      onLongPress();
    }
  }, [onLongPress]);

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(scaleDown, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(0.8, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 150 });
    })
    .onEnd(() => {
      runOnJS(handlePress)();
    })
    .enabled(!disabled);

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(handleLongPress)();
    })
    .enabled(!disabled && !!onLongPress);

  const composedGesture = onLongPress
    ? Gesture.Race(tapGesture, longPressGesture)
    : tapGesture;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
};

export default AnimatedPressable;
