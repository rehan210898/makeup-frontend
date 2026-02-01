import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmerPosition]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerPosition.value,
          [0, 1],
          [-200, 200]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width: width as number,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255,255,255,0.4)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

// Pre-built skeleton variants
export const SkeletonText: React.FC<{ lines?: number; lineHeight?: number }> = ({
  lines = 3,
  lineHeight = 16,
}) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? '60%' : '100%'}
        height={lineHeight}
        style={index < lines - 1 ? styles.lineSpacing : undefined}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <Skeleton height={150} borderRadius={12} />
    <View style={styles.cardContent}>
      <Skeleton width="80%" height={18} style={styles.cardTitle} />
      <Skeleton width="40%" height={14} />
    </View>
  </View>
);

export const SkeletonProductCard: React.FC = () => (
  <View style={styles.productCard}>
    <Skeleton height={180} borderRadius={12} />
    <View style={styles.productContent}>
      <Skeleton width="90%" height={14} style={styles.productTitle} />
      <Skeleton width="50%" height={12} style={styles.productPrice} />
      <Skeleton width="30%" height={18} />
    </View>
  </View>
);

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} />
);

export const SkeletonListItem: React.FC = () => (
  <View style={styles.listItem}>
    <SkeletonAvatar />
    <View style={styles.listItemContent}>
      <Skeleton width="70%" height={16} style={styles.listItemTitle} />
      <Skeleton width="40%" height={12} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.gray[100],
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
  },
  gradient: {
    flex: 1,
  },
  textContainer: {
    gap: 8,
  },
  lineSpacing: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    marginBottom: 8,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productContent: {
    padding: 10,
  },
  productTitle: {
    marginBottom: 6,
  },
  productPrice: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    marginBottom: 6,
  },
});

export default Skeleton;
