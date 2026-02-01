import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  Layout,
  SlideInLeft,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';

type AnimationType =
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'slideInLeft'
  | 'slideInRight'
  | 'zoomIn';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

const getEnteringAnimation = (
  type: AnimationType,
  index: number,
  delay: number,
  duration: number
) => {
  const baseDelay = delay + index * 50;

  switch (type) {
    case 'fadeInUp':
      return FadeInUp.duration(duration).delay(baseDelay).springify();
    case 'fadeInDown':
      return FadeInDown.duration(duration).delay(baseDelay).springify();
    case 'fadeInLeft':
      return FadeInLeft.duration(duration).delay(baseDelay).springify();
    case 'fadeInRight':
      return FadeInRight.duration(duration).delay(baseDelay).springify();
    case 'slideInLeft':
      return SlideInLeft.duration(duration).delay(baseDelay).springify();
    case 'slideInRight':
      return SlideInRight.duration(duration).delay(baseDelay).springify();
    case 'zoomIn':
      return ZoomIn.duration(duration).delay(baseDelay).springify();
    default:
      return FadeInUp.duration(duration).delay(baseDelay).springify();
  }
};

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index = 0,
  animation = 'fadeInUp',
  delay = 0,
  duration = 400,
  style,
}) => {
  return (
    <Animated.View
      entering={getEnteringAnimation(animation, index, delay, duration)}
      layout={Layout.springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedListItem;
