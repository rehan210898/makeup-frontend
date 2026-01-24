import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 20; // Matches Home screen cards
const LIST_CARD_WIDTH = (width / 2) - 15; // Matches ProductList cards (roughly)

interface ProductCardSkeletonProps {
  variant?: 'home' | 'list';
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ variant = 'home' }) => {
  const cardWidth = variant === 'home' ? CARD_WIDTH : LIST_CARD_WIDTH;
  
  return (
    <View style={[styles.container, { width: cardWidth }]}>
      {/* Image Skeleton */}
      <Skeleton height={cardWidth} borderRadius={12} style={styles.image} />
      
      {/* Content Skeleton */}
      <View style={styles.details}>
        {/* Title */}
        <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
        <Skeleton height={14} width="60%" style={{ marginBottom: 10 }} />
        
        {/* Price Row */}
        <View style={styles.priceRow}>
          <Skeleton height={18} width="40%" />
          <Skeleton height={18} width="30%" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  image: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  details: {
    padding: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
