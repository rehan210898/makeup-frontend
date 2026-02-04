import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Animated, Platform, StatusBar, Modal, ScrollView, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { Product, AttributeTaxonomy, AttributeTerm, Category, Tag } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { Image } from 'expo-image';
import HeartIcon from '../../components/icons/HeartIcon';
import ProductCard from '../../components/products/ProductCard';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import FilterIcon from '../../components/icons/FilterIcon';
import CartIcon from '../../components/icons/CartIcon';
import { ProductListSkeleton } from '../../components/skeletons/ProductListSkeleton';

type ProductListRouteProp = RouteProp<RootStackParamList, 'ProductList'>;
type ProductListNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Header Height Calculation
const HEADER_HEIGHT = 90; 
const FILTER_BAR_HEIGHT = 60;
const TOTAL_HEADER_HEIGHT = HEADER_HEIGHT + FILTER_BAR_HEIGHT;
const PRODUCT_ITEM_HEIGHT = 320;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 30) / 2; // (Width - 20px padding - 10px gap) / 2

export default function ProductListScreen() {
  const route = useRoute<ProductListRouteProp>();
  const navigation = useNavigation<ProductListNavigationProp>();
  const { categoryId, categoryName, search: initialSearch, attribute, termId, title } = route.params || {};

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  
  const [activeSort, setActiveSort] = useState('popularity');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter State
  const [selectedFilters, setSelectedFilters] = useState<Record<string, number[]>>(() => {
    const filters: Record<string, number[]> = {};
    if (categoryId) filters['category'] = [categoryId];
    if (attribute && termId) filters[attribute] = [termId];
    return filters;
  }); 
  const [tempFilters, setTempFilters] = useState<Record<string, number[]>>({});
  
  // Price Filter State
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({ min: '', max: '' });
  const [tempPriceRange, setTempPriceRange] = useState<{min: string, max: string}>({ min: '', max: '' });

  const [loadingFilters, setLoadingFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [attributes, setAttributes] = useState<AttributeTaxonomy[]>([]);
  const [activeTab, setActiveTab] = useState<string | number>('categories'); 
  const [attributeTerms, setAttributeTerms] = useState<Record<number, AttributeTerm[]>>({});
  const [loadingTerms, setLoadingTerms] = useState(false);

  const sortOptions = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Latest', value: 'date' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
  ];

  // Animation Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const { addItem, getItemQuantity, itemCount } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const wishlistItems = useWishlistStore((state) => state.items);

  const isInWishlist = useCallback((id: number) => {
    return wishlistItems.some(p => p.id === id);
  }, [wishlistItems]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadProducts(1, true);
  }, [activeCategoryId, activeSort]);

  useEffect(() => {
    if (attribute) {
      loadAttributes();
    }
  }, [attribute]);

  useEffect(() => {
    if (attribute && attributes.length > 0) {
      const attr = attributes.find(a => a.slug === attribute);
      if (attr && !attributeTerms[attr.id]) {
        loadTerms(attr.id);
      }
    }
  }, [attributes, attribute]);

  useEffect(() => {
    if (filterModalVisible) {
      setTempFilters(selectedFilters);
      setTempPriceRange(priceRange);
      if (attributes.length === 0) loadAttributes();
      if (categories.length === 0) loadCategories();
      if (tags.length === 0) loadTags();
    }
  }, [filterModalVisible]);

  useEffect(() => {
    if (typeof activeTab === 'number' && !attributeTerms[activeTab]) {
      loadTerms(activeTab);
    }
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error.message || 'Unknown error');
    }
  };

  const loadTags = async () => {
    try {
      const response = await productService.getTags();
      setTags(response.data || []);
    } catch (error: any) {
      console.error('Error loading tags:', error.message || 'Unknown error');
    }
  };

  const loadAttributes = async () => {
    setLoadingFilters(true);
    try {
      const response = await productService.getAttributes();
      if (response.data && response.data.length > 0) {
        setAttributes(response.data);
      }
    } catch (error: any) {
      console.error('Error loading attributes:', error.message || 'Unknown error');
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadTerms = async (id: number) => {
    setLoadingTerms(true);
    try {
      const response = await productService.getAttributeTerms(id);
      setAttributeTerms(prev => ({ ...prev, [id]: response.data || [] }));
    } catch (error: any) {
      console.error('Error loading terms:', error.message || 'Unknown error');
    } finally {
      setLoadingTerms(false);
    }
  };

  const diffClamp = Animated.diffClamp(scrollY, 0, FILTER_BAR_HEIGHT);
  const filterBarTranslateY = diffClamp.interpolate({
    inputRange: [0, FILTER_BAR_HEIGHT],
    outputRange: [0, -FILTER_BAR_HEIGHT],
  });

  const loadProducts = async (pageToLoad: number, reset: boolean = false, options?: { category?: number | null, search?: string, filters?: Record<string, number[]>, price?: {min: string, max: string} }) => {
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        page: pageToLoad,
        per_page: 10,
        status: 'publish',
        orderby: 'popularity', 
        order: 'desc'
      };

      const effectiveFilters = options?.filters || selectedFilters;
      const effectivePrice = options?.price || priceRange;

      const hasSelectedFilters = Object.values(effectiveFilters).some(arr => arr && arr.length > 0) || !!effectivePrice.min || !!effectivePrice.max;
      
      let effectiveCategory = options?.category !== undefined ? options.category : activeCategoryId;
      let effectiveSearch = options?.search !== undefined ? options.search : searchQuery;

      if (hasSelectedFilters && options === undefined) {
         effectiveCategory = null; 
         effectiveSearch = ''; 
      }

      if (effectiveCategory) {
        params.category = effectiveCategory.toString();
      } else if (effectiveSearch) {
        params.search = effectiveSearch;
      }

      if (effectivePrice.min) params.min_price = effectivePrice.min;
      if (effectivePrice.max) params.max_price = effectivePrice.max;

      if (activeSort === 'popularity') { params.orderby = 'popularity'; params.order = 'desc'; }
      if (activeSort === 'date') { params.orderby = 'date'; params.order = 'desc'; }
      if (activeSort === 'price_asc') { params.orderby = 'price'; params.order = 'asc'; }
      if (activeSort === 'price_desc') { params.orderby = 'price'; params.order = 'desc'; }

      if (effectiveFilters['category'] && effectiveFilters['category'].length > 0) {
         params.category = effectiveFilters['category'].join(',');
      }

      if (effectiveFilters['tag'] && effectiveFilters['tag'].length > 0) {
         params.tag = effectiveFilters['tag'].join(',');
      }

      const attrParams: string[] = [];
      const termParams: string[] = [];

      Object.entries(effectiveFilters).forEach(([slug, terms]) => {
          if (slug !== 'category' && slug !== 'tag' && terms.length > 0) {
              attrParams.push(slug);
              termParams.push(terms.join(','));
          }
      });

      if (attrParams.length > 0) {
          if (attrParams.length === 1) {
              params.attribute = attrParams[0];
              params.attribute_term = termParams[0];
          } else {
             params.attribute = attrParams;
             params.attribute_term = termParams;
          }
      }

      const response = await productService.getProducts(params);
      
      const newProducts = response.data || [];
      
      if (newProducts.length < 10) {
        setHasMore(false);
      }

      setProducts(prev => {
        if (reset) return newProducts;
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNewProducts];
      });
      setPage(pageToLoad);

    } catch (error: any) {
      console.error('Error loading products:', error.message || 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSort = (sortValue: string) => {
    setActiveSort(sortValue);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadProducts(page + 1);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setActiveCategoryId(null); 
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      loadProducts(1, true); 
    }, 500);
  };

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const toggleWishlist = (id: number) => {
    if (isInWishlist(id)) {
      removeFromWishlist(id);
    } else {
      const item = products.find(p => p.id === id);
      if (item) addToWishlist(item);
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    return (
      <View style={{ width: CARD_WIDTH, marginBottom: 10 }}>
        <ProductCard 
          item={item}
          onPress={handleProductPress}
          onWishlistPress={toggleWishlist}
          isWishlisted={isInWishlist(item.id)}
        />
      </View>
    );
  };
    
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: PRODUCT_ITEM_HEIGHT,
      offset: PRODUCT_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeftIcon color={COLORS.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <FilterIcon size={18} color={COLORS.text.muted} /> 
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={COLORS.text.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'CartTab' } as any)} style={styles.cartBtn}>
            <CartIcon size={24} color={COLORS.primary} />
            {itemCount > 0 && (
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View 
        style={[
          styles.filterBar,
          { transform: [{ translateY: filterBarTranslateY }] }
        ]}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScrollView}
        >
          <TouchableOpacity 
            style={styles.filterBtn} 
            onPress={() => setFilterModalVisible(true)}
          >
            <FilterIcon size={20} color={COLORS.primary} />
            {Object.values(selectedFilters).some(arr => arr && arr.length > 0) && (
                <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>

          {Object.entries(selectedFilters).map(([key, ids]) => {
              if (!ids || ids.length === 0) return null;
              
              let labelPrefix = '';
              let items: {id: number, name: string}[] = [];
              
              if (key === 'category') {
                  items = categories;
                  if (categoryId && categoryName && ids.includes(categoryId)) {
                      const exists = items.find(i => i.id === categoryId);
                      if (!exists) {
                          items = [...items, { id: categoryId, name: categoryName } as any];
                      }
                  }
              } else if (key === 'tag') {
                  items = tags;
              } else {
                  const attr = attributes.find(a => a.slug === key);
                  if (attr) {
                      labelPrefix = `${attr.name}: `;
                      items = attributeTerms[attr.id] || [];
                  }
              }
              
              return ids.map(id => {
                  const item = items.find(i => i.id === id);
                  if (!item) return null; 
                  
                  return (
                    <TouchableOpacity
                        key={`${key}-${id}`}
                        style={styles.activeFilterChip}
                        onPress={() => {
                            const current = selectedFilters[key] || [];
                            const newFilters = { ...selectedFilters, [key]: current.filter(i => i !== id) };
                            setSelectedFilters(newFilters);
                            loadProducts(1, true, { filters: newFilters });
                        }}
                    >
                        <Text style={styles.activeFilterText}>{labelPrefix}{item.name} ×</Text>
                    </TouchableOpacity>
                  );
              });
          })}

          {sortOptions.map((option) => (
            <TouchableOpacity 
              key={option.value}
              style={[
                styles.sortChip, 
                activeSort === option.value && styles.activeSortChip
              ]}
              onPress={() => handleSort(option.value)}
            >
              <Text style={[
                styles.sortText,
                activeSort === option.value && styles.activeSortText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {loading && !loadingMore ? (
        <ProductListSkeleton />
      ) : (
        <Animated.FlatList
          data={products}
          extraData={wishlistItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{
            paddingTop: TOTAL_HEADER_HEIGHT + 10, 
            paddingHorizontal: 10,
            paddingBottom: 20
          }}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          maxToRenderPerBatch={20}
          windowSize={21}
          initialNumToRender={10}
          removeClippedSubviews={false}
          getItemLayout={getItemLayout}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} /> : null}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.filterContainer}>
                <View style={styles.filterSidebar}>
                    <FlatList
                        data={[
                            { id: 'price', name: 'Price' } as any,
                            { id: 'categories', name: 'Categories' } as any,
                            { id: 'tags', name: 'Popular Choices' } as any,
                            ...attributes
                        ]}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => {
                            const isSelected = activeTab === item.id;
                            let hasSelection = false;
                            
                            if (item.id === 'price') {
                                hasSelection = !!tempPriceRange.min || !!tempPriceRange.max;
                            } else if (item.id === 'categories') {
                                hasSelection = tempFilters['category']?.length > 0;
                            } else if (item.id === 'tags') {
                                hasSelection = tempFilters['tag']?.length > 0;
                            } else {
                                hasSelection = tempFilters[item.slug]?.length > 0;
                            }
                            
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.attributeTab,
                                        isSelected && styles.activeAttributeTab
                                    ]}
                                    onPress={() => setActiveTab(item.id)}
                                >
                                    <Text style={[
                                        styles.attributeTabText,
                                        isSelected && styles.activeAttributeTabText
                                    ]}>{item.name}</Text>
                                    {hasSelection && (
                                        <View style={styles.filterDot} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                <View style={styles.filterContent}>
                    {activeTab === 'price' ? (
                        <View style={styles.priceFilterContainer}>
                            <Text style={styles.priceLabel}>Range (₹)</Text>
                            <View style={styles.priceRow}>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="Min"
                                    keyboardType="numeric"
                                    value={tempPriceRange.min}
                                    onChangeText={text => setTempPriceRange({...tempPriceRange, min: text})}
                                />
                                <Text style={styles.priceDash}>-</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="Max"
                                    keyboardType="numeric"
                                    value={tempPriceRange.max}
                                    onChangeText={text => setTempPriceRange({...tempPriceRange, max: text})}
                                />
                            </View>
                        </View>
                    ) : activeTab === 'categories' ? (
                        <FlatList
                            data={categories.filter(c => (c.count || 0) > 0)}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => {
                                const isSelected = tempFilters['category']?.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        style={styles.termItem}
                                        onPress={() => {
                                            const current = tempFilters['category'] || [];
                                            const newFilters = { ...tempFilters };
                                            if (isSelected) {
                                                newFilters['category'] = current.filter(id => id !== item.id);
                                            } else {
                                                newFilters['category'] = [...current, item.id];
                                            }
                                            setTempFilters(newFilters);
                                        }}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
                                            {isSelected && <View style={styles.checkboxInner} />}
                                        </View>
                                        <Text style={[styles.termText, isSelected && styles.checkedTermText]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    ) : activeTab === 'tags' ? (
                        <FlatList
                            data={tags}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => {
                                const isSelected = tempFilters['tag']?.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        style={styles.termItem}
                                        onPress={() => {
                                            const current = tempFilters['tag'] || [];
                                            const newFilters = { ...tempFilters };
                                            if (isSelected) {
                                                newFilters['tag'] = current.filter(id => id !== item.id);
                                            } else {
                                                newFilters['tag'] = [...current, item.id];
                                            }
                                            setTempFilters(newFilters);
                                        }}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
                                            {isSelected && <View style={styles.checkboxInner} />}
                                        </View>
                                        <Text style={[styles.termText, isSelected && styles.checkedTermText]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <Text style={styles.emptyTerms}>No popular choices available</Text>
                            }
                        />
                    ) : (
                        loadingTerms && !attributeTerms[activeTab as number] ? (
                            <ActivityIndicator color={COLORS.primary} size="small" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={attributeTerms[activeTab as number] || []}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item }) => {
                                    if (item.count === 0) return null;

                                    const activeAttr = attributes.find(a => a.id === activeTab);
                                    if (!activeAttr) return null;

                                    const isSelected = tempFilters[activeAttr.slug]?.includes(item.id);
                                    return (
                                        <TouchableOpacity
                                            style={styles.termItem}
                                            onPress={() => {
                                                const current = tempFilters[activeAttr.slug] || [];
                                                const newFilters = { ...tempFilters };
                                                if (isSelected) {
                                                    newFilters[activeAttr.slug] = current.filter(id => id !== item.id);
                                                } else {
                                                    newFilters[activeAttr.slug] = [...current, item.id];
                                                }
                                                setTempFilters(newFilters);
                                            }}
                                        >
                                            <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
                                                {isSelected && <View style={styles.checkboxInner} />}
                                            </View>
                                            <Text style={[styles.termText, isSelected && styles.checkedTermText]}>
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    !loadingTerms ? <Text style={styles.emptyTerms}>No options available</Text> : null
                                }
                            />
                        )
                    )}
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyBtn} 
              onPress={() => {
                setFilterModalVisible(false);
                setSelectedFilters(tempFilters);
                setPriceRange(tempPriceRange);
                
                const hasActiveFilters = Object.values(tempFilters).some(arr => arr && arr.length > 0) || !!tempPriceRange.min || !!tempPriceRange.max;
                
                if (hasActiveFilters) {
                    setSearchQuery('');
                    setActiveCategoryId(null);
                    loadProducts(1, true, { category: null, search: '', filters: tempFilters, price: tempPriceRange });
                } else {
                    loadProducts(1, true, { filters: tempFilters, price: tempPriceRange });
                }
              }}
            >
              <Text style={styles.applyBtnText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    backgroundColor: COLORS.white,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight,
    paddingHorizontal: 15,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.main,
    height: '100%',
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
  filterBar: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    height: FILTER_BAR_HEIGHT,
    backgroundColor: COLORS.white,
    zIndex: 900,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    justifyContent: 'center',
  },
  filterScrollView: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeSortChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  activeSortText: {
    color: COLORS.white,
  },
  activeFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  closeText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  modalBody: {
    flex: 1,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  filterContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  filterSidebar: {
    width: '35%',
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  filterContent: {
    flex: 1,
    padding: 15,
  },
  attributeTab: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  activeAttributeTab: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  attributeTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeAttributeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },
  termText: {
    fontSize: 14,
    color: '#333',
  },
  checkedTermText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyTerms: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: TOTAL_HEADER_HEIGHT + 50,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  details: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
    height: 40,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  saleTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFE5E5',
    color: COLORS.error,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
    marginTop: 0, 
    marginHorizontal: -12, 
    marginBottom: -12, 
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  disabledBtn: {
    backgroundColor: '#CCCCCC',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  priceFilterContainer: {
    padding: 10,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.primary,
    backgroundColor: '#fff',
  },
  priceDash: {
    marginHorizontal: 10,
    fontSize: 20,
    color: '#666',
  },
});
