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
          <Skeleton width={80} height={100} borderRadius={12} />
          {/* Info */}
          <View style={styles.info}>
            {/* Name - 2 lines */}
            <Skeleton width="85%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width="55%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
            {/* Price */}
            <Skeleton width="35%" height={16} borderRadius={4} />
            {/* Add to cart button */}
            <Skeleton width={40} height={40} borderRadius={8} style={{ marginTop: 8 }} />
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
    marginBottom: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
});
