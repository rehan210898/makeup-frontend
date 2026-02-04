import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '../../constants';
import { Skeleton } from '../common/Skeleton';

interface SectionSkeletonProps {
  width?: number;
  height?: number;
  count?: number;
  horizontal?: boolean;
}

export const SectionSkeleton: React.FC<SectionSkeletonProps> = ({ 
  width = 140, 
  height = 200, 
  count = 4,
  horizontal = true
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <Skeleton width={120} height={24} borderRadius={4} />
         <Skeleton width={60} height={16} borderRadius={4} />
      </View>
      <FlatList
        data={Array.from({ length: count })}
        keyExtractor={(_, index) => index.toString()}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={() => (
          <View style={{ width, marginRight: 12 }}>
            <Skeleton width="100%" height={height} borderRadius={12} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width="40%" height={16} borderRadius={4} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  }
});
