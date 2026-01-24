import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay, 
  withSequence,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// SVG Paths
const STAR_PATH = "M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z";
const HEART_PATH = "M20.84 2.73a5.49 5.49 0 0 0-7.78 0L12 3.79l-1.06-1.06a5.49 5.49 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.49 5.49 0 0 0 0-7.78z";
const SPARKLE_PATH = "M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9L12 0Z";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const FloatingIcon = ({ path, color, size, startX, startY, delay, duration }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration / 2 }),
          withTiming(0, { duration: duration / 2 })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-50, { duration: duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
      position: 'absolute',
      left: startX,
      top: startY,
    };
  });

  return (
    <AnimatedSvg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill={color} 
        style={style}
    >
      <Path d={path} />
    </AnimatedSvg>
  );
};

export const FloatingIconsBackground = () => {
  // Generate random positions
  const icons = [];
  const count = 15; // Number of floating icons

  for (let i = 0; i < count; i++) {
    const type = i % 3; // 0: Star, 1: Heart, 2: Sparkle
    const path = type === 0 ? STAR_PATH : type === 1 ? HEART_PATH : SPARKLE_PATH;
    const color = type === 0 ? '#FFD700' : type === 1 ? '#FFB6C1' : '#E0FFFF'; // Gold, Pink, Cyan
    const size = Math.random() * 15 + 10; // 10-25
    const startX = Math.random() * (width - 20);
    const startY = Math.random() * (height * 0.8) + 50; // Spread across height
    const delay = Math.random() * 2000;
    const duration = Math.random() * 3000 + 4000; // 4-7s

    icons.push(
      <FloatingIcon 
        key={i}
        path={path}
        color={color}
        size={size}
        startX={startX}
        startY={startY}
        delay={delay}
        duration={duration}
      />
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {icons}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1, // Behind everything
    overflow: 'hidden',
  },
});
