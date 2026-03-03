import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

export const ProductDetailSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header bar placeholder */}
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Product Image */}
        <Skeleton width={width} height={width * 1.2} borderRadius={0} />

        {/* Image Dots */}
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width={8} height={8} borderRadius={4} style={{ marginHorizontal: 3 }} />
          ))}
        </View>

        <View style={styles.details}>
          {/* Product Name */}
          <Skeleton width="90%" height={24} borderRadius={6} style={{ marginBottom: 6 }} />
          <Skeleton width="60%" height={24} borderRadius={6} style={{ marginBottom: 16 }} />

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Skeleton width={80} height={16} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Skeleton width={100} height={28} borderRadius={6} />
            <Skeleton width={70} height={18} borderRadius={4} style={{ marginLeft: 10 }} />
            <Skeleton width={60} height={20} borderRadius={4} style={{ marginLeft: 10 }} />
          </View>

          {/* Divider */}
          <Skeleton width="100%" height={1} borderRadius={0} style={{ marginVertical: 16 }} />

          {/* Variation Selector */}
          <Skeleton width={80} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
          <View style={styles.variationRow}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width={60} height={36} borderRadius={18} style={{ marginRight: 8 }} />
            ))}
          </View>

          {/* Divider */}
          <Skeleton width="100%" height={1} borderRadius={0} style={{ marginVertical: 16 }} />

          {/* Description heading */}
          <Skeleton width={120} height={20} borderRadius={4} style={{ marginBottom: 12 }} />

          {/* Description lines */}
          <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="95%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />

          {/* Related Products heading */}
          <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: 12 }} />

          {/* Related products row */}
          <View style={styles.relatedRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ width: width / 2.5, marginRight: 10 }}>
                <Skeleton width="100%" height={width / 2.5} borderRadius={12} />
                <Skeleton width="80%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Add to Cart Bar */}
      <View style={styles.bottomBar}>
        <Skeleton width="100%" height={50} borderRadius={25} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  content: {
    paddingBottom: 100,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  details: {
    padding: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  relatedRow: {
    flexDirection: 'row',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
