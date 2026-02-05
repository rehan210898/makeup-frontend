import React, { useCallback } from 'react';
import { StyleSheet, Text, ActivityIndicator, Platform, ViewStyle, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  fullWidth?: boolean;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  haptic = true,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [disabled, loading, haptic, onPress]);

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(0.8, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 150 });
    })
    .onEnd(() => {
      runOnJS(handlePress)();
    })
    .enabled(!disabled && !loading);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(opacity.value, [0.8, 1], [disabled ? 0.5 : 0.8, disabled ? 0.5 : 1]),
  }));

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
          text: { fontSize: 14 },
        };
      case 'large':
        return {
          container: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 20 },
          text: { fontSize: 18 },
        };
      default:
        return {
          container: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 },
          text: { fontSize: 16 },
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          colors: [COLORS.primary, COLORS.primaryDark] as const,
          textColor: COLORS.white,
          borderColor: 'transparent',
        };
      case 'secondary':
        return {
          colors: [COLORS.accent, COLORS.accentDark] as const,
          textColor: COLORS.white,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          colors: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as const,
          textColor: COLORS.primary,
          borderColor: COLORS.primary,
        };
      case 'ghost':
        return {
          colors: ['transparent', 'transparent'] as const,
          textColor: COLORS.primary,
          borderColor: 'transparent',
        };
      default:
        return {
          colors: [COLORS.primary, COLORS.primaryDark] as const,
          textColor: COLORS.white,
          borderColor: 'transparent',
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.container,
          sizeStyles.container,
          { borderColor: variantStyles.borderColor },
          fullWidth && styles.fullWidth,
          animatedStyle,
          style,
        ]}
      >
        {variant !== 'ghost' && (
          <>
            <BlurView
              intensity={40}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={variantStyles.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </>
        )}
        <Animated.View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={variantStyles.textColor} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && <Animated.View style={styles.iconLeft}>{icon}</Animated.View>}
              <Text style={[styles.text, sizeStyles.text, { color: variantStyles.textColor }, textStyle]}>
                {title}
              </Text>
              {icon && iconPosition === 'right' && <Animated.View style={styles.iconRight}>{icon}</Animated.View>}
            </>
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default GlassButton;
