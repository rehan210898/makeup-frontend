import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

interface ProductCardSkeletonProps {
  variant?: 'default' | 'compact' | 'image_only';
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ variant = 'default' }) => {
  const isCompact = variant === 'compact';
  const isImageOnly = variant === 'image_only';

  return (
    <View style={[styles.container, isImageOnly && styles.imageOnlyContainer]}>
      {/* Image - matches ProductCard's aspectRatio: 1 with 12px padding */}
      <View style={[styles.imageContainer, isImageOnly && styles.imageOnlyImageContainer]}>
        <Skeleton width="100%" height="100%" borderRadius={isImageOnly ? 12 : 8} />
      </View>

      {/* Details - matches ProductCard details section */}
      {!isImageOnly && (
        <View style={[styles.details, isCompact && styles.compactDetails]}>
          {/* Name - 2 lines */}
          <Skeleton
            width="90%"
            height={isCompact ? 11 : 13}
            borderRadius={4}
            style={{ marginBottom: 4 }}
          />
          <Skeleton
            width="60%"
            height={isCompact ? 11 : 13}
            borderRadius={4}
            style={{ marginBottom: isCompact ? 6 : 8 }}
          />

          {/* Price */}
          <Skeleton
            width="40%"
            height={isCompact ? 13 : 16}
            borderRadius={4}
            style={{ marginBottom: 4 }}
          />
          {/* Original price + discount */}
          <View style={styles.priceRow}>
            <Skeleton width="25%" height={12} borderRadius={4} />
            <Skeleton width="20%" height={12} borderRadius={4} style={{ marginLeft: 6 }} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 31, 29, 0.08)',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.gray[50],
    padding: 12,
  },
  details: {
    padding: 10,
    paddingTop: 8,
  },
  compactDetails: {
    padding: 8,
    paddingTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageOnlyContainer: {
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  imageOnlyImageContainer: {
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
