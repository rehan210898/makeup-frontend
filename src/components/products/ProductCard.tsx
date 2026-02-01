import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants';
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
  variant?: 'default' | 'compact';
}

const ProductCard = ({ item, onPress, onWishlistPress, isWishlisted = false, hidePrice = false, variant = 'default' }: ProductCardProps) => {
  const inStock = item.inStock ?? true;
  
  const regularPriceVal = item.regularPrice ? parseFloat(item.regularPrice) : 0;
  const priceVal = item.price ? parseFloat(item.price) : 0;
  
  const isDiscounted = item.onSale || (regularPriceVal > priceVal);
  
  const discountPercent = (regularPriceVal > 0 && regularPriceVal > priceVal)
    ? Math.round(((regularPriceVal - priceVal) / regularPriceVal) * 100)
    : 0;
    
  const rating = item.averageRating ? parseFloat(item.averageRating) : 0;

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => onPress(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.compactImageContainer}>
          <Image
            source={{ uri: item.images?.[0]?.src }}
            style={styles.image}
            contentFit="contain"
            transition={300}
            placeholder={{ blurhash: 'L9AB*A%LPqyuI~IpIVaK00?b~qD%' }}
          />
        </View>
        <View style={styles.compactDetails}>
           <Text style={styles.compactName} numberOfLines={1}>{item.name}</Text>
           <View style={styles.compactPriceRow}>
             <Text style={styles.compactPrice}>₹{item.price}</Text>
             {isDiscounted && (
                <Text style={styles.compactDiscount}>{discountPercent}% off</Text>
             )}
           </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(item.id)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.images?.[0]?.src }}
          style={styles.image}
          contentFit="contain"
          contentPosition="center"
          transition={300}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'L9AB*A%LPqyuI~IpIVaK00?b~qD%' }} // Simple gray blurhash as placeholder
        />
        
        {!hidePrice && rating > 3 && (
            <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                <View style={{ marginLeft: 2 }}>
                  <StarIcon size={10} color="green" filled />
                </View>
            </View>
        )}

        {!hidePrice && onWishlistPress && (
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={(e) => {
              e.stopPropagation();
              onWishlistPress(item.id);
            }}
          >
            <HeartIcon size={16} color={isWishlisted ? COLORS.error : COLORS.primary} filled={isWishlisted} />
          </TouchableOpacity>
        )}

        {!hidePrice && !inStock && (
            <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
        )}
      </View>

      {!hidePrice && (
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.priceContainer}>
          <View style={styles.priceLeft}>
            <View style={styles.currentPriceRow}>
              <IndianRupeeIcon size={16} color={COLORS.primary} />
              <Text style={styles.price}>{item.price}</Text>
            </View>
            
            {isDiscounted && item.regularPrice && (
              <View style={styles.discountInfo}>
                <Text style={styles.regularPrice}>₹{item.regularPrice}</Text>
                <Text style={styles.discountText}>{discountPercent}% off</Text>
              </View>
            )}
          </View>

          {isDiscounted && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>SALE</Text>
            </View>
          )}
        </View>
      </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure card takes full available height in a stretched row
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 0, // Margin is handled by parent gap/padding
    borderWidth: 1,
    borderColor: 'rgba(102, 31, 29, 0.08)',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Keep square
    backgroundColor: COLORS.white,
    position: 'relative',
    overflow: 'hidden',
    padding: 12, // Add padding to constrain the contained image size
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'green',
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
  },
  outOfStockText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  details: {
    padding: 10,
  },
  name: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 16,
    height: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLeft: {
    flex: 1,
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 2,
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  regularPrice: {
    fontSize: 11,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 11,
    color: 'green',
    fontWeight: '600',
    marginLeft: 4,
  },
  saleBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: 'bold',
  },
  compactContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 0,
    overflow: 'hidden',
    // Minimal shadow
  },
  compactImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  compactDetails: {
    padding: 6,
  },
  compactName: {
    fontSize: 11,
    color: COLORS.primary,
    marginBottom: 4,
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  compactDiscount: {
    fontSize: 10,
    color: 'green',
    fontWeight: 'bold',
  },
});

export default memo(ProductCard);
