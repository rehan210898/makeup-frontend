import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  FlatList,
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

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = 90;
const CONTENT_WIDTH = SCREEN_WIDTH - TAB_WIDTH;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = (CONTENT_WIDTH - 48) / GRID_COLUMNS; // 48 = padding + gaps

export default function CategoriesScreen() {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { itemCount } = useCartStore();
  const tabScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await layoutService.getCategoryTree();
      setCategoryTree(data || []);
      setSelectedIndex(0);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (index: number) => {
    setSelectedIndex(index);
    // Scroll tab into view
    tabScrollRef.current?.scrollTo({
      y: index * 96 - 100,
      animated: true,
    });
  };

  const handleSubcategoryPress = (sub: SubCategory) => {
    const mainCat = categoryTree[selectedIndex];
    navigation.push('ProductList', {
      categoryId: sub.id,
      categoryName: sub.name,
      parentCategoryId: mainCat.id,
      parentCategoryName: mainCat.name,
    });
  };

  const handleMainCategoryPress = (cat: CategoryTreeItem) => {
    navigation.push('ProductList', {
      categoryId: cat.id,
      categoryName: cat.name,
    });
  };

  const selectedCategory = categoryTree[selectedIndex];
  const subcategories = selectedCategory?.subcategories || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
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
          onPress={() =>
            navigation.navigate('MainTabs', { screen: 'CartTab' } as any)
          }
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

      {loading && <CategoriesSkeleton />}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: COLORS.primary }]}
            onPress={loadCategories}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && categoryTree.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories found</Text>
        </View>
      )}

      {!loading && !error && categoryTree.length > 0 && (
        <View style={styles.body}>
          {/* Left: Vertical Category Tabs */}
          <ScrollView
            ref={tabScrollRef}
            style={styles.tabBar}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {categoryTree.map((cat, index) => {
              const isActive = index === selectedIndex;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  activeOpacity={0.7}
                  onPress={() => handleTabPress(index)}
                >
                  <View
                    style={[
                      styles.tabIconContainer,
                      isActive && styles.tabIconContainerActive,
                    ]}
                  >
                    {cat.image ? (
                      <Image
                        source={{ uri: cat.image }}
                        style={styles.tabIcon}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={`tab-${cat.id}`}
                      />
                    ) : (
                      getIconForCategory(cat.name, {
                        size: 24,
                        color: isActive ? COLORS.primary : COLORS.gray[500],
                      })
                    )}
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Right: Subcategory Grid */}
          <ScrollView
            style={styles.contentArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentAreaInner}
          >
            {/* Main category header — tap to see all products */}
            <TouchableOpacity
              style={styles.mainCatHeader}
              activeOpacity={0.7}
              onPress={() => handleMainCategoryPress(selectedCategory)}
            >
              <Text style={styles.mainCatTitle}>{selectedCategory.name}</Text>
              <Text style={styles.viewAllText}>View All &rsaquo;</Text>
            </TouchableOpacity>

            {subcategories.length === 0 ? (
              <View style={styles.noSubContainer}>
                <Text style={styles.noSubText}>
                  No subcategories available
                </Text>
                <TouchableOpacity
                  style={styles.browseAllBtn}
                  onPress={() => handleMainCategoryPress(selectedCategory)}
                >
                  <Text style={styles.browseAllText}>
                    Browse all {selectedCategory.name}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.subGrid}>
                {subcategories.map((sub, index) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={styles.subItem}
                    activeOpacity={0.7}
                    onPress={() => handleSubcategoryPress(sub)}
                  >
                    <View
                      style={[
                        styles.subImageContainer,
                        {
                          backgroundColor:
                            COLORS.pastels[index % COLORS.pastels.length],
                        },
                      ]}
                    >
                      {sub.image ? (
                        <Image
                          source={{ uri: sub.image }}
                          style={styles.subImage}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                          recyclingKey={`sub-${sub.id}`}
                        />
                      ) : (
                        getIconForCategory(sub.name, {
                          size: 32,
                          color: COLORS.primary,
                        })
                      )}
                    </View>
                    <Text style={styles.subName} numberOfLines={2}>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
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
  cartBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    zIndex: 10,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: FONTS.display.bold,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },

  // ─── Body: Tab + Content ──────────────────
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // ─── Left Tab Bar ─────────────────────────
  tabBar: {
    width: TAB_WIDTH,
    backgroundColor: COLORS.gray[50],
    borderRightWidth: 1,
    borderRightColor: COLORS.gray[200],
  },
  tabBarContent: {
    paddingVertical: 8,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  tabIconContainerActive: {
    backgroundColor: COLORS.backgroundSubtle,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  tabIcon: {
    width: '100%',
    height: '100%',
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontFamily: FONTS.display.medium,
    lineHeight: 13,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.display.bold,
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },

  // ─── Right Content Area ───────────────────
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentAreaInner: {
    padding: 16,
    paddingBottom: 100,
  },
  mainCatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  mainCatTitle: {
    fontSize: 18,
    fontFamily: FONTS.display.bold,
    color: COLORS.text.main,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: FONTS.display.medium,
  },

  // ─── Subcategory Grid ─────────────────────
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  subItem: {
    width: `${100 / GRID_COLUMNS}%`,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  subImageContainer: {
    width: GRID_ITEM_SIZE - 24,
    height: GRID_ITEM_SIZE - 24,
    borderRadius: (GRID_ITEM_SIZE - 24) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  subImage: {
    width: '100%',
    height: '100%',
    borderRadius: (GRID_ITEM_SIZE - 24) / 2,
  },
  subName: {
    marginTop: 8,
    fontSize: 11,
    color: COLORS.text.main,
    textAlign: 'center',
    fontFamily: FONTS.display.medium,
    lineHeight: 14,
    height: 28,
  },

  // ─── No Subcategories State ───────────────
  noSubContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  noSubText: {
    fontSize: 14,
    color: COLORS.gray[400],
    marginBottom: 16,
  },
  browseAllBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseAllText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.display.medium,
  },
});
