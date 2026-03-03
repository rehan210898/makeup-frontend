import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2.5);
const GAP = 10;

export const HomeSkeleton = () => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Hero Carousel - matches 420px height */}
      <Skeleton
        width={width}
        height={420}
        borderRadius={0}
        style={styles.heroCarousel}
      />

      {/* Category Circles Section */}
      <View style={styles.section}>
        <Skeleton width={140} height={22} style={styles.sectionTitle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <View key={i} style={styles.categoryItem}>
                <Skeleton width={68} height={68} borderRadius={34} />
                <Skeleton width={50} height={12} borderRadius={4} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Promo Banner */}
      <View style={styles.section}>
        <Skeleton width="100%" height={160} borderRadius={16} />
      </View>

      {/* Product Slider Section 1 */}
      <View style={styles.section}>
        <Skeleton width={160} height={22} style={styles.sectionTitle} />
        <View style={styles.sliderRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ width: CARD_WIDTH, marginRight: GAP }}>
              <Skeleton width={CARD_WIDTH} height={CARD_WIDTH} borderRadius={12} />
              <Skeleton width="85%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
              <Skeleton width="35%" height={16} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Flash Sale / Section Title */}
      <View style={styles.section}>
        <Skeleton width="100%" height={50} borderRadius={12} />
      </View>

      {/* Product Slider Section 2 */}
      <View style={styles.section}>
        <Skeleton width={180} height={22} style={styles.sectionTitle} />
        <View style={styles.sliderRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ width: CARD_WIDTH, marginRight: GAP }}>
              <Skeleton width={CARD_WIDTH} height={CARD_WIDTH} borderRadius={12} />
              <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              <Skeleton width="45%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
              <Skeleton width="30%" height={16} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Brand Grid */}
      <View style={styles.section}>
        <Skeleton width={120} height={22} style={styles.sectionTitle} />
        <View style={styles.brandRow}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.brandItem}>
              <Skeleton width={70} height={70} borderRadius={35} />
              <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Product Slider Section 3 */}
      <View style={styles.section}>
        <Skeleton width={150} height={22} style={styles.sectionTitle} />
        <View style={styles.sliderRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ width: CARD_WIDTH, marginRight: GAP }}>
              <Skeleton width={CARD_WIDTH} height={CARD_WIDTH} borderRadius={12} />
              <Skeleton width="75%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              <Skeleton width="40%" height={16} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
  heroCarousel: {
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 18,
  },
  sliderRow: {
    flexDirection: 'row',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  brandItem: {
    alignItems: 'center',
  },
});
