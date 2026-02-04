import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { Product } from '../../types';
import HeartIcon from '../icons/HeartIcon';
import StarIcon from '../icons/StarIcon';
import IndianRupeeIcon from './IndianRupeeIcon';

interface ProductCardProps {
  item: Product;
  onPress: (id: number) => void;
  onWishlistPress?: (id: number) => void;
  isWishlisted?: boolean;
  hidePrice?: boolean;
  variant?: 'default' | 'compact' | 'image_only';
  index?: number; // Used for pastel background color rotation
}

// Get pastel background color based on index or product id
const getPastelColor = (index: number, productId: number): string => {
  const colorIndex = index >= 0 ? index : productId;
  return COLORS.pastels[colorIndex % COLORS.pastels.length];
};

const ProductCard = ({ item, onPress, onWishlistPress, isWishlisted = false, hidePrice = false, variant = 'default', index = -1 }: ProductCardProps) => {
  const inStock = item.inStock ?? true;
  const isCompact = variant === 'compact';
  const isImageOnly = variant === 'image_only';

  const regularPriceVal = item.regularPrice ? parseFloat(item.regularPrice) : 0;
  const priceVal = item.price ? parseFloat(item.price) : 0;

  const isDiscounted = item.onSale || (regularPriceVal > priceVal);

  const discountPercent = (regularPriceVal > 0 && regularPriceVal > priceVal)
    ? Math.round(((regularPriceVal - priceVal) / regularPriceVal) * 100)
    : 0;

  const rating = item.averageRating ? parseFloat(item.averageRating) : 0;

  // Get pastel background color
  const pastelBgColor = getPastelColor(index, item.id);

  return (
    <TouchableOpacity
      style={[
        styles.container, 
        isImageOnly && styles.imageOnlyContainer
      ]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.9}
    >
      <View style={[
        styles.imageContainer, 
        { backgroundColor: pastelBgColor },
        isImageOnly && styles.imageOnlyImageContainer
      ]}>
        <Image
          source={{ uri: item.images?.[0]?.src }}
          style={[styles.image, isImageOnly && styles.imageOnlyImage]}
          contentFit="cover"
          contentPosition="center"
          transition={300}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'L9AB*A%LPqyuI~IpIVaK00?b~qD%' }}
        />
        
        {/* 1. Top Left: Wishlist */}
        {!hidePrice && onWishlistPress && !isImageOnly && (
          <TouchableOpacity
            style={[styles.wishlistBtn, isCompact && styles.compactWishlistBtn]}
            onPress={(e) => {
              e.stopPropagation();
              onWishlistPress(item.id);
            }}
          >
            <HeartIcon size={isCompact ? 12 : 16} color={isWishlisted ? COLORS.error : COLORS.primary} filled={isWishlisted} />
          </TouchableOpacity>
        )}

        {/* 2. Top Right: Review (Rating) */}
        {!hidePrice && rating > 0 && !isImageOnly && (
            <View style={[styles.ratingBadge, isCompact && styles.compactRatingBadge]}>
                <Text style={[styles.ratingText, isCompact && styles.compactRatingText]}>{rating.toFixed(1)}</Text>
                <StarIcon size={isCompact ? 8 : 10} color={COLORS.black} filled />
            </View>
        )}

        {!hidePrice && !inStock && !isImageOnly && (
            <View style={styles.outOfStockBadge}>
                <Text style={[styles.outOfStockText, isCompact && styles.compactOutOfStockText]}>Out of Stock</Text>
            </View>
        )}
      </View>

      {!hidePrice && !isImageOnly && (
      <View style={[styles.details, isCompact && styles.compactDetails]}>
        <Text style={[styles.name, isCompact && styles.compactName]} numberOfLines={2}>{item.name}</Text>
        
        {/* 3. Bottom Left: Price Stack */}
        <View style={styles.priceBlock}>
          <View style={styles.offerPriceRow}>
             <IndianRupeeIcon size={isCompact ? 12 : 14} color={COLORS.primary} />
             <Text style={[styles.offerPrice, isCompact && styles.compactOfferPrice]}>{item.price}</Text>
          </View>
          
          {isDiscounted && item.regularPrice && (
            <View style={styles.originalPriceRow}>
              <Text style={[styles.originalPrice, isCompact && styles.compactOriginalPrice]}>₹{item.regularPrice}</Text>
              <Text style={[styles.discountText, isCompact && styles.compactDiscountText]}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* 4. Bottom Right: Creative Sale Badge (Moved to details) */}
        {isDiscounted && (
            <View style={[styles.creativeSaleBadge, isCompact && styles.compactSaleBadge]}>
                <Text style={[styles.creativeSaleText, isCompact && styles.compactSaleText]}>SALE</Text>
            </View>
        )}
      </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(102, 31, 29, 0.08)',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    position: 'relative',
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Badges
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  compactWishlistBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 6,
    left: 6,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFC107', // Yellow
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactRatingBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    top: 6,
    right: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.black,
  },
  creativeSaleBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FFC107', // Yellow
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
    transform: [{ rotate: '-5deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compactSaleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    bottom: 6,
    right: 6,
  },
  creativeSaleText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    zIndex: 20,
  },
  outOfStockText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  compactOutOfStockText: {
    fontSize: 8,
  },
  
  // Details
  details: {
    padding: 10,
    paddingTop: 8,
  },
  compactDetails: {
    padding: 8,
    paddingTop: 6,
  },
  name: {
    fontFamily: FONTS.display.medium,
    fontSize: 13,
    color: COLORS.text.main,
    marginBottom: 6,
    lineHeight: 18,
    height: 36,
  },
  compactName: {
    fontSize: 11,
    lineHeight: 15,
    height: 30,
    marginBottom: 4,
  },
  priceBlock: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  offerPrice: {
    fontFamily: FONTS.display.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 2,
  },
  compactOfferPrice: {
    fontSize: 13,
  },
  originalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
    fontFamily: FONTS.display.medium,
  },
  compactOriginalPrice: {
    fontSize: 10,
  },
  discountText: {
    fontFamily: FONTS.display.bold,
    fontSize: 11,
    color: COLORS.success,
  },
  compactDiscountText: {
    fontSize: 9,
  },
  
  // Image Only Variant Styles
  imageOnlyContainer: {
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  imageOnlyImageContainer: {
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.white, // Or keep pastel if desired, but usually image only means full bleed
  },
  imageOnlyImage: {
    borderRadius: 12,
  },
});

export default memo(ProductCard);