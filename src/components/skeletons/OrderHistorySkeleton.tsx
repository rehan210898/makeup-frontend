import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

export const OrderHistorySkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          {/* Order header: order number + status badge */}
          <View style={styles.header}>
            <Skeleton width={100} height={16} borderRadius={4} />
            <Skeleton width={70} height={22} borderRadius={4} />
          </View>
          {/* Date */}
          <Skeleton width={90} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
          {/* Divider */}
          <View style={styles.divider} />
          {/* Item lines */}
          <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
          {/* Footer: total label + total amount */}
          <View style={styles.footer}>
            <Skeleton width={40} height={14} borderRadius={4} />
            <Skeleton width={70} height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
