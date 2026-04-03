import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

export const CategoriesSkeleton = () => {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} style={styles.card}>
          {/* Circular image placeholder */}
          <View style={[styles.imageCircle, { backgroundColor: COLORS.pastels[i % COLORS.pastels.length] }]}>
            <Skeleton width={80} height={80} borderRadius={40} />
          </View>
          {/* Name placeholder */}
          <View style={styles.nameContainer}>
            <Skeleton width="70%" height={12} borderRadius={4} />
            <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  card: {
    width: '31%',
    margin: '1.15%',
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    marginBottom: 10,
    alignItems: 'center',
  },
  imageCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginTop: 10,
  },
  nameContainer: {
    padding: 10,
    alignItems: 'center',
  },
});
