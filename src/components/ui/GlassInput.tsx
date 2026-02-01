import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { COLORS } from '../../constants';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  variant?: 'default' | 'filled' | 'minimal';
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  variant = 'default',
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusValue = useSharedValue(0);

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      focusValue.value = withTiming(1, { duration: 200 });
      onFocus?.(e);
    },
    [onFocus, focusValue]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      focusValue.value = withTiming(0, { duration: 200 });
      onBlur?.(e);
    },
    [onBlur, focusValue]
  );

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? COLORS.error
      : interpolateColor(
          focusValue.value,
          [0, 1],
          ['rgba(255, 255, 255, 0.4)', COLORS.primary]
        );

    return {
      borderColor,
      transform: [{ scale: withTiming(isFocused ? 1.01 : 1, { duration: 150 }) }],
    };
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          intensity: 30,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          intensity: 0,
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          intensity: 50,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
      )}
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: variantStyles.backgroundColor },
          animatedContainerStyle,
        ]}
      >
        {variant !== 'minimal' && (
          <BlurView
            intensity={variantStyles.intensity}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.inputContainer}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            style={[
              styles.input,
              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightIcon ? styles.inputWithRightIcon : undefined,
              inputStyle,
            ]}
            placeholderTextColor={COLORS.gray[400]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...textInputProps}
          />
          {rightIcon && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      {(error || hint) && (
        <Text style={[styles.hint, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
    marginLeft: 4,
  },
  labelError: {
    color: COLORS.error,
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[800],
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    paddingLeft: 16,
  },
  rightIcon: {
    paddingRight: 16,
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: COLORS.error,
  },
});

export default GlassInput;
