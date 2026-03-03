import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../constants';

interface ScrollToTopButtonProps {
  visible: boolean;
  onPress: () => void;
  bottom?: number;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  visible,
  onPress,
  bottom = Platform.OS === 'ios' ? 100 : 80,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(visible ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.6, 1], Extrapolation.CLAMP) },
      { translateY: interpolate(progress.value, [0, 1], [20, 0], Extrapolation.CLAMP) },
    ],
  }));

  if (!visible && progress.value === 0) return null;

  return (
    <Animated.View style={[styles.container, { bottom }, animatedStyle]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 15l-6-6-6 6" />
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 500,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
