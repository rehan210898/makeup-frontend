import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInUp,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS } from '../../constants';
import { Product } from '../../types';
import { haptic } from '../../utils/haptics';

interface AnimatedProductCardProps {
  item: Product;
  onPress: (id: number) => void;
  onWishlistPress?: (id: number) => void;
  isWishlisted?: boolean;
  index?: number;
  variant?: 'default' | 'compact';
}

const AnimatedProductCard: React.FC<AnimatedProductCardProps> = ({
  item,
  onPress,
  onWishlistPress,
  isWishlisted = false,
  index = 0,
  variant = 'default',
}) => {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const wishlistScale = useSharedValue(1);

  const handlePress = useCallback(() => {
    haptic.light();
    onPress(item.id);
  }, [item.id, onPress]);

  const handleWishlistPress = useCallback(() => {
    haptic.medium();
    wishlistScale.value = withSpring(1.3, { damping: 8 }, () => {
      wishlistScale.value = withSpring(1);
    });
    onWishlistPress?.(item.id);
  }, [item.id, onWishlistPress, wishlistScale]);

  const cardGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      pressed.value = withTiming(1, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      pressed.value = withTiming(0, { duration: 150 });
    })
    .onEnd(() => {
      handlePress();
    });

  const wishlistGesture = Gesture.Tap()
    .onEnd(() => {
      handleWishlistPress();
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(pressed.value, [0, 1], [0.1, 0.2], Extrapolation.CLAMP),
  }));

  const animatedWishlistStyle = useAnimatedStyle(() => ({
    transform: [{ scale: wishlistScale.value }],
  }));

  const imageUrl = item.images?.[0]?.src || '';
  const isOnSale = item.onSale && item.salePrice;
  const discountPercent = isOnSale
    ? Math.round(
        ((parseFloat(item.regularPrice) - parseFloat(item.salePrice || '0')) /
          parseFloat(item.regularPrice)) *
          100
      )
    : 0;

  const isCompact = variant === 'compact';

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(index * 50).springify()}
      style={styles.wrapper}
    >
      <GestureDetector gesture={cardGesture}>
        <Animated.View
          style={[
            styles.container,
            isCompact && styles.containerCompact,
            animatedCardStyle,
          ]}
        >
          <View style={[styles.imageContainer, isCompact && styles.imageContainerCompact]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />

            {/* Discount Badge */}
            {isOnSale && discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}

            {/* Wishlist Button */}
            {onWishlistPress && (
              <GestureDetector gesture={wishlistGesture}>
                <Animated.View style={[styles.wishlistButton, animatedWishlistStyle]}>
                  <Text style={styles.wishlistIcon}>{isWishlisted ? '❤️' : '🤍'}</Text>
                </Animated.View>
              </GestureDetector>
            )}

            {/* Out of Stock Overlay */}
            {item.stockStatus === 'outofstock' && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>

          <View style={[styles.info, isCompact && styles.infoCompact]}>
            <Text
              style={[styles.name, isCompact && styles.nameCompact]}
              numberOfLines={isCompact ? 1 : 2}
            >
              {item.name}
            </Text>

            <View style={styles.priceContainer}>
              {isOnSale ? (
                <>
                  <Text style={[styles.salePrice, isCompact && styles.priceCompact]}>
                    ₹{parseFloat(item.salePrice || '0').toFixed(0)}
                  </Text>
                  <Text style={[styles.regularPrice, isCompact && styles.regularPriceCompact]}>
                    ₹{parseFloat(item.regularPrice).toFixed(0)}
                  </Text>
                </>
              ) : (
                <Text style={[styles.price, isCompact && styles.priceCompact]}>
                  ₹{parseFloat(item.price).toFixed(0)}
                </Text>
              )}
            </View>

            {/* Rating */}
            {item.averageRating && parseFloat(item.averageRating) > 0 && !isCompact && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingText}>{parseFloat(item.averageRating).toFixed(1)}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
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
  containerCompact: {
    borderRadius: 12,
  },
  imageContainer: {
    aspectRatio: 0.85,
    backgroundColor: COLORS.gray[100],
    position: 'relative',
  },
  imageContainerCompact: {
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  wishlistIcon: {
    fontSize: 16,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  info: {
    padding: 12,
  },
  infoCompact: {
    padding: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 6,
    lineHeight: 18,
  },
  nameCompact: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceCompact: {
    fontSize: 13,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  regularPrice: {
    fontSize: 13,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
  },
  regularPriceCompact: {
    fontSize: 11,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  ratingStar: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
});

export default AnimatedProductCard;
