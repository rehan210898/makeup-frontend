import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_PADDING = 32;
const CIRCLE = Math.floor((SCREEN_WIDTH - GRID_PADDING - 36) / GRID_COLUMNS);

export const CategoriesSkeleton = () => (
  <View style={styles.body}>
    {/* Horizontal tab skeleton */}
    <View style={styles.tabBarWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.tabItem}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <Skeleton width={50} height={10} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </ScrollView>
    </View>

    {/* Grid skeleton */}
    <View style={styles.gridArea}>
      <View style={styles.headerRow}>
        <Skeleton width={120} height={17} borderRadius={4} />
        <Skeleton width={55} height={13} borderRadius={4} />
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.gridItem}>
            <View style={[styles.circle, { backgroundColor: COLORS.pastels[i % COLORS.pastels.length] }]}>
              <Skeleton width={CIRCLE} height={CIRCLE} borderRadius={CIRCLE / 2} />
            </View>
            <Skeleton width="65%" height={10} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  body: { flex: 1 },

  tabBarWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  tabItem: {
    alignItems: 'center',
    width: 80,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  gridArea: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  gridItem: {
    width: (SCREEN_WIDTH - GRID_PADDING) / GRID_COLUMNS,
    alignItems: 'center',
    marginBottom: 20,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    overflow: 'hidden',
  },
});
