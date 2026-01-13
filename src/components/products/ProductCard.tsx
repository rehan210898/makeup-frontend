import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants';
import { Product } from '../../types';
import HeartIcon from '../icons/HeartIcon';
import IndianRupeeIcon from './IndianRupeeIcon';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 20;

interface ProductCardProps {
  item: Product;
  onPress: (id: number) => void;
  onWishlistPress?: (product: Product) => void;
  isWishlisted?: boolean;
}

const ProductCard = ({ item, onPress, onWishlistPress, isWishlisted = false }: ProductCardProps) => {
  const inStock = item.inStock ?? true;
  
  const regularPriceVal = item.regularPrice ? parseFloat(item.regularPrice) : 0;
  const priceVal = item.price ? parseFloat(item.price) : 0;
  
  const isDiscounted = item.onSale || (regularPriceVal > priceVal);
  
  const discountPercent = (regularPriceVal > 0 && regularPriceVal > priceVal)
    ? Math.round(((regularPriceVal - priceVal) / regularPriceVal) * 100)
    : 0;
    
  const rating = item.averageRating ? parseFloat(item.averageRating) : 0;

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
          contentFit="cover"
          contentPosition="top"
          transition={300}
        />
        
        {rating > 3 && (
            <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{rating.toFixed(1)} ★</Text>
            </View>
        )}

        {onWishlistPress && (
          <TouchableOpacity 
            style={styles.wishlistBtn}
            onPress={(e) => {
              e.stopPropagation();
              onWishlistPress(item);
            }}
          >
            <HeartIcon size={16} color={isWishlisted ? COLORS.error : COLORS.primary} filled={isWishlisted} />
          </TouchableOpacity>
        )}

        {!inStock && (
            <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
        )}
      </View>

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
              <Text style={styles.saleBadgeText}>🔥 SALE</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
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
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
    overflow: 'hidden',
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
});

export default memo(ProductCard);
