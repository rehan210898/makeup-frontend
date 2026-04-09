import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';
import { useCartStore } from '../../store/cartStore';
import CartIcon from '../../components/icons/CartIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import { FONTS } from '../../constants/fonts';
import { CategoriesSkeleton } from '../../components/skeletons/CategoriesSkeleton';
import layoutService, { CategoryTreeItem, SubCategory } from '../../services/layoutService';
import { getIconForCategory } from '../../components/icons/CategoryIcons';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_PADDING = 32;
const CIRCLE_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING - 36) / GRID_COLUMNS);
const TAB_ICON_SIZE = 44;

export default function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const { itemCount } = useCartStore();

  const [tree, setTree] = useState<CategoryTreeItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await layoutService.getCategoryTree();
        setTree(data || []);
        setActiveIdx(0);
      } catch (e: any) {
        console.error('Category load error:', e);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectTab = useCallback((index: number) => {
    setActiveIdx(index);
    // Scroll so the selected tab is roughly centered
    tabScrollRef.current?.scrollTo({ x: index * 80 - SCREEN_WIDTH / 2 + 40, animated: true });
  }, []);

  const goToProducts = useCallback(
    (catId: number, catName: string, parentId?: number, parentName?: string) => {
      navigation.push('ProductList', {
        categoryId: catId,
        categoryName: catName,
        parentCategoryId: parentId,
        parentCategoryName: parentName,
      });
    },
    [navigation],
  );

  const activeCat = tree[activeIdx];
  const subs = activeCat?.subcategories ?? [];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <SearchIcon size={18} color={COLORS.text.muted} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={COLORS.text.muted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={(e) =>
              navigation.push('ProductList', { search: e.nativeEvent.text })
            }
          />
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'CartTab' } as any)}
          style={styles.cartBtn}
        >
          <CartIcon size={24} color={COLORS.primary} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Body */}
      {loading ? (
        <CategoriesSkeleton />
      ) : error ? (
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              setError('');
              layoutService.getCategoryTree()
                .then((d) => { setTree(d || []); setActiveIdx(0); })
                .catch(() => setError('Failed to load categories'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tree.length === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyText}>No categories found</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {/* ── Horizontal Category Tabs ── */}
          <View style={styles.tabBarWrap}>
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBarContent}
            >
              {tree.map((cat, index) => {
                const active = index === activeIdx;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.tab, active && styles.tabActive]}
                    activeOpacity={0.7}
                    onPress={() => selectTab(index)}
                  >
                    <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                      {cat.image ? (
                        <Image
                          source={{ uri: cat.image }}
                          style={styles.tabImg}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        getIconForCategory(cat.name, {
                          size: 20,
                          color: active ? COLORS.primary : COLORS.gray[500],
                        })
                      )}
                    </View>
                    <Text
                      style={[styles.tabText, active && styles.tabTextActive]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Subcategory Grid ── */}
          <ScrollView
            style={styles.gridArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
          >
            {/* Category header */}
            <TouchableOpacity
              style={styles.catHeader}
              activeOpacity={0.7}
              onPress={() => goToProducts(activeCat.id, activeCat.name)}
            >
              <Text style={styles.catTitle}>{activeCat.name}</Text>
              <Text style={styles.viewAll}>View All &rsaquo;</Text>
            </TouchableOpacity>

            {subs.length === 0 ? (
              <View style={styles.emptySubWrap}>
                <Text style={styles.emptySubText}>No subcategories available</Text>
                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => goToProducts(activeCat.id, activeCat.name)}
                >
                  <Text style={styles.browseBtnText}>Browse all {activeCat.name}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.subGrid}>
                {subs.map((sub, idx) => (
                  <TouchableOpacity
                    key={`${activeIdx}-${sub.id}`}
                    style={styles.subItem}
                    activeOpacity={0.7}
                    onPress={() => goToProducts(sub.id, sub.name, activeCat.id, activeCat.name)}
                  >
                    <View
                      style={[
                        styles.subCircle,
                        { backgroundColor: COLORS.pastels[idx % COLORS.pastels.length] },
                      ]}
                    >
                      {sub.image ? (
                        <Image
                          source={{ uri: sub.image }}
                          style={styles.subImg}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={150}
                        />
                      ) : (
                        getIconForCategory(sub.name, { size: 28, color: COLORS.primary })
                      )}
                    </View>
                    <Text style={styles.subText} numberOfLines={2}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 42,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text.main,
    padding: 0,
    fontFamily: FONTS.display.medium,
  },
  cartBtn: { position: 'relative', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.primary, minWidth: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2,
    borderWidth: 1.5, borderColor: COLORS.white,
  },
  cartBadgeText: { color: COLORS.white, fontSize: 9, fontFamily: FONTS.display.bold },

  // Center states
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: COLORS.error, fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  emptyText: { fontSize: 16, color: COLORS.gray[500] },

  // Body — vertical stack: tabs on top, grid below
  body: { flex: 1 },

  // ── Horizontal Tab Bar ──
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
  tab: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    width: 80,
  },
  tabActive: {
    backgroundColor: COLORS.backgroundSubtle,
  },
  tabIconWrap: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    borderRadius: TAB_ICON_SIZE / 2,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  tabIconWrapActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  tabImg: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    borderRadius: TAB_ICON_SIZE / 2,
  },
  tabText: {
    fontSize: 10,
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: FONTS.display.medium,
    lineHeight: 13,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.display.bold,
  },

  // ── Subcategory grid area ──
  gridArea: { flex: 1, backgroundColor: COLORS.white },
  gridContent: { paddingHorizontal: 16, paddingBottom: 100 },

  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  catTitle: { fontSize: 17, fontFamily: FONTS.display.bold, color: COLORS.text.main },
  viewAll: { fontSize: 13, color: COLORS.primary, fontFamily: FONTS.display.medium },

  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  subItem: {
    width: (SCREEN_WIDTH - GRID_PADDING) / GRID_COLUMNS,
    alignItems: 'center',
    marginBottom: 20,
  },
  subCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  subImg: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  subText: {
    marginTop: 8,
    fontSize: 11,
    color: COLORS.text.main,
    textAlign: 'center',
    fontFamily: FONTS.display.medium,
    lineHeight: 14,
    height: 28,
    maxWidth: CIRCLE_SIZE + 10,
  },

  emptySubWrap: { alignItems: 'center', paddingTop: 50 },
  emptySubText: { fontSize: 14, color: COLORS.gray[400], marginBottom: 16 },
  browseBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseBtnText: { color: COLORS.white, fontSize: 14, fontFamily: FONTS.display.medium },
});
