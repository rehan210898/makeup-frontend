import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 30) / 2;

// Match ProductListScreen layout
const HEADER_HEIGHT = 90;
const FILTER_BAR_HEIGHT = 60;
const TOTAL_HEADER_HEIGHT = HEADER_HEIGHT + FILTER_BAR_HEIGHT;

export const ProductListSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={{ paddingTop: TOTAL_HEADER_HEIGHT + 10, paddingHorizontal: 10 }}>
        {/* Rows of 2 product cards */}
        {[1, 2, 3, 4].map(row => (
          <View key={row} style={styles.row}>
            <View style={{ width: CARD_WIDTH }}>
              <ProductCardSkeleton />
            </View>
            <View style={{ width: CARD_WIDTH }}>
              <ProductCardSkeleton />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
});
