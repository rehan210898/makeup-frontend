import React from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

// Mimic ProductListScreen layout
const HEADER_HEIGHT = 90; 
const FILTER_BAR_HEIGHT = 60;
const TOTAL_HEADER_HEIGHT = HEADER_HEIGHT + FILTER_BAR_HEIGHT;

export const ProductListSkeleton = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={[1, 2, 3, 4, 5, 6, 7, 8]}
        keyExtractor={(item) => item.toString()}
        numColumns={2}
        renderItem={() => <ProductCardSkeleton variant="list" />}
        contentContainerStyle={{
            paddingTop: TOTAL_HEADER_HEIGHT + 10,
            paddingHorizontal: 10,
            paddingBottom: 20
        }}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
});
