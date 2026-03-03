import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 30 - 20) / 3; // 3 columns, 15px padding each side, ~10px gaps

export const CategoriesSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Grid: 3 columns x 4 rows */}
      {[1, 2, 3, 4].map(row => (
        <View key={row} style={styles.row}>
          {[1, 2, 3].map(col => (
            <View key={col} style={styles.card}>
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
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    width: '31%',
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  nameContainer: {
    padding: 10,
    alignItems: 'center',
  },
});
