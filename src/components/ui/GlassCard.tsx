import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  animated?: boolean;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 60,
  tint = 'light',
  variant = 'default',
  animated = false,
  padding = 16,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
            },
            android: {
              elevation: 8,
            },
          }),
        };
      case 'outlined':
        return {
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.6)',
        };
      case 'gradient':
        return {};
      default:
        return {};
    }
  };

  const CardWrapper = animated ? Animated.View : View;
  const animatedProps = animated ? { entering: FadeIn.duration(300), exiting: FadeOut.duration(200) } : {};

  const content = (
    <CardWrapper
      style={[styles.container, getVariantStyle(), style]}
      {...animatedProps}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      {variant === 'gradient' && (
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
    </CardWrapper>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

export default GlassCard;
