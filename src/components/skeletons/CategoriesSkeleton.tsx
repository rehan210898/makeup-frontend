import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

export const CategoriesSkeleton = () => {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} style={styles.card}>
          {/* Image placeholder */}
          <Skeleton width="100%" height={90} borderRadius={0} />
          {/* Name placeholder */}
          <View style={styles.nameContainer}>
            <Skeleton width="80%" height={12} borderRadius={4} />
            <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  nameContainer: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FAFAFA',
  },
});
