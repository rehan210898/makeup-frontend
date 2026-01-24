import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

export const HomeSkeleton = () => {
  return (
    <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.content}
    >
        {/* Header Search Bar Skeleton */}
        <View style={styles.header}>
             <Skeleton width={100} height={24} style={{ marginBottom: 20 }} />
             <Skeleton width="100%" height={50} borderRadius={16} />
        </View>

        {/* Welcome Block */}
        <View style={styles.section}>
            <Skeleton width="100%" height={80} borderRadius={12} />
        </View>

        {/* Hero Banner */}
        <View style={styles.section}>
             <Skeleton width="100%" height={200} borderRadius={16} />
        </View>

        {/* Categories Circle List */}
        <View style={styles.section}>
             <Skeleton width={150} height={20} style={{ marginBottom: 15 }} />
             <View style={styles.row}>
                 {[1, 2, 3, 4].map(i => (
                     <View key={i} style={styles.categoryItem}>
                         <Skeleton width={70} height={70} borderRadius={35} style={{ marginBottom: 8 }} />
                         <Skeleton width={60} height={12} />
                     </View>
                 ))}
             </View>
        </View>

        {/* Product Slider 1 */}
        <View style={styles.section}>
             <Skeleton width={180} height={20} style={{ marginBottom: 15 }} />
             <View style={styles.row}>
                 <ProductCardSkeleton />
                 <View style={{ width: 20 }} />
                 <ProductCardSkeleton />
             </View>
        </View>

        {/* Product Slider 2 */}
        <View style={styles.section}>
             <Skeleton width={180} height={20} style={{ marginBottom: 15 }} />
             <View style={styles.row}>
                 <ProductCardSkeleton />
                 <View style={{ width: 20 }} />
                 <ProductCardSkeleton />
             </View>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    paddingBottom: 50,
  },
  header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: COLORS.primary,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      marginBottom: 20,
  },
  section: {
      paddingHorizontal: 20,
      marginBottom: 30,
  },
  row: {
      flexDirection: 'row',
  },
  categoryItem: {
      alignItems: 'center',
      marginRight: 15,
  }
});
