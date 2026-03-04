import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

export const WishlistSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          {/* Image */}
          <Skeleton width={70} height={90} borderRadius={10} />
          {/* Info */}
          <View style={styles.info}>
            {/* Name row */}
            <Skeleton width="75%" height={14} borderRadius={4} />
            {/* Footer row: prices left, cart button right */}
            <View style={styles.footer}>
              <View>
                {/* Discount row */}
                <View style={styles.discountRow}>
                  <Skeleton width={50} height={12} borderRadius={4} />
                  <Skeleton width={40} height={12} borderRadius={4} />
                </View>
                {/* Price */}
                <Skeleton width={70} height={16} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              {/* Add to cart button */}
              <Skeleton width={40} height={40} borderRadius={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.cream,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
