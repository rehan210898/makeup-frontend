import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

const TAB_WIDTH = 90;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - TAB_WIDTH;
const GRID_COLUMNS = 3;
const ITEM_SIZE = (CONTENT_WIDTH - 48) / GRID_COLUMNS - 24;

export const CategoriesSkeleton = () => {
  return (
    <View style={styles.body}>
      {/* Left tab skeleton */}
      <View style={styles.tabBar}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`tab-${i}`} style={styles.tabItem}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <Skeleton width={50} height={10} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Right grid skeleton */}
      <View style={styles.content}>
        {/* Header skeleton */}
        <View style={styles.headerSkeleton}>
          <Skeleton width={120} height={18} borderRadius={4} />
          <Skeleton width={60} height={14} borderRadius={4} />
        </View>

        {/* Grid skeleton */}
        <View style={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={`sub-${i}`} style={styles.gridItem}>
              <View style={[styles.circle, { backgroundColor: COLORS.pastels[i % COLORS.pastels.length] }]}>
                <Skeleton width={ITEM_SIZE} height={ITEM_SIZE} borderRadius={ITEM_SIZE / 2} />
              </View>
              <Skeleton width="70%" height={10} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  tabBar: {
    width: TAB_WIDTH,
    backgroundColor: COLORS.gray[50],
    borderRightWidth: 1,
    borderRightColor: COLORS.gray[200],
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: `${100 / GRID_COLUMNS}%`,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  circle: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    overflow: 'hidden',
  },
});
