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
import ProductCard from '../../components/products/ProductCard';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import FilterIcon from '../../components/icons/FilterIcon';
import CartIcon from '../../components/icons/CartIcon';
import { ProductListSkeleton } from '../../components/skeletons/ProductListSkeleton';
import SearchIcon from '../../components/icons/SearchIcon';
import { ScrollToTopButton } from '../../components/common/ScrollToTopButton';
import { PriceRangeSlider } from '../../components/common/PriceRangeSlider';

type ProductListRouteProp = RouteProp<RootStackParamList, 'ProductList'>;
type ProductListNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HEADER_HEIGHT = 90;
const FILTER_BAR_HEIGHT = 60;
const TOTAL_HEADER_HEIGHT = HEADER_HEIGHT + FILTER_BAR_HEIGHT;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 30) / 2;

// Tab IDs
const TAB_CATEGORY = 'category';
const TAB_SUBCATEGORY = 'subcategory';
const TAB_PRICE = 'price';

export default function ProductListScreen() {
  const route = useRoute<ProductListRouteProp>();
  const navigation = useNavigation<ProductListNavigationProp>();
  const { categoryId, categoryName, parentCategoryId, parentCategoryName, search: initialSearch, attribute, termId, title } = route.params || {};

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeSort, setActiveSort] = useState('popularity');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // === Applied filter state ===
  // If parentCategoryId is provided → subcategory navigation (set both main + sub)
  // If only categoryId → main category navigation
  const [selectedFilters, setSelectedFilters] = useState<Record<string, number[]>>(() => {
    const filters: Record<string, number[]> = {};
    if (parentCategoryId && categoryId) {
      // Navigated from a subcategory
      filters['category'] = [parentCategoryId];
      filters['subcategory'] = [categoryId];
    } else if (categoryId) {
      // Navigated from a main category
      filters['category'] = [categoryId];
    }
    if (attribute && termId) filters[attribute] = [termId];
    return filters;
  });
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  // === Temp filter state (inside modal) ===
  const [tempFilters, setTempFilters] = useState<Record<string, number[]>>({});
  const [tempPriceRange, setTempPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  // === Filter data ===
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [attributes, setAttributes] = useState<AttributeTaxonomy[]>([]);
  const [attributeTerms, setAttributeTerms] = useState<Record<number, AttributeTerm[]>>({});
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // === Price range bounds (dynamic) ===
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);
  const [sliderLow, setSliderLow] = useState(0);
  const [sliderHigh, setSliderHigh] = useState(10000);
  const [loadingPriceRange, setLoadingPriceRange] = useState(false);

  // === Active tab in filter modal ===
  const [activeTab, setActiveTab] = useState<string | number>(TAB_CATEGORY);

  const sortOptions = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Latest', value: 'date' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
  ];

  // Animation Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { itemCount } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const wishlistItemIds = useWishlistStore((state) => state.itemIds);

  const isInWishlist = useCallback((id: number) => {
    return wishlistItemIds.includes(id);
  }, [wishlistItemIds]);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      setShowScrollTop(value > 400);
    });
    return () => scrollY.removeListener(listenerId);
  }, [scrollY]);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Re-initialize filters when route params change (handles screen reuse via navigate)
  const paramsKey = `${categoryId}-${parentCategoryId}-${attribute}-${termId}`;
  const prevParamsKey = useRef(paramsKey);
  useEffect(() => {
    if (prevParamsKey.current !== paramsKey) {
      prevParamsKey.current = paramsKey;
      const newFilters: Record<string, number[]> = {};
      if (parentCategoryId && categoryId) {
        newFilters['category'] = [parentCategoryId];
        newFilters['subcategory'] = [categoryId];
      } else if (categoryId) {
        newFilters['category'] = [categoryId];
      }
      if (attribute && termId) newFilters[attribute] = [termId];
      setSelectedFilters(newFilters);
      setPriceRange({ min: '', max: '' });
      setSearchQuery(initialSearch || '');
      setActiveCategoryId(null);
      setProducts([]);
      setPage(1);
      setHasMore(true);
      loadProducts(1, true, { filters: newFilters, price: { min: '', max: '' } });
      return; // skip the normal load below
    }
  }, [paramsKey]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadProducts(1, true);
  }, [activeCategoryId, activeSort]);

  useEffect(() => {
    if (attribute) loadAttributes();
  }, [attribute]);

  useEffect(() => {
    if (attribute && attributes.length > 0) {
      const attr = attributes.find(a => a.slug === attribute);
      if (attr && !attributeTerms[attr.id]) loadTerms(attr.id);
    }
  }, [attributes, attribute]);

  // Track which category was used to fetch the current price range bounds
  const lastPriceFetchCatRef = useRef<number | null | undefined>(undefined);

  // When filter modal opens, initialize temp state and load filter data
  useEffect(() => {
    if (filterModalVisible) {
      setTempFilters({ ...selectedFilters });
      setTempPriceRange({ ...priceRange });
      setActiveTab(TAB_CATEGORY);

      // Load filter data if not loaded yet
      if (mainCategories.length === 0) loadMainCategories();
      if (attributes.length === 0) loadAttributes();
      if (tags.length === 0) loadTags();

      // Restore slider from applied price range
      if (priceRange.min) setSliderLow(parseInt(priceRange.min));
      if (priceRange.max) setSliderHigh(parseInt(priceRange.max));

      // Fetch price bounds only if we don't have them yet for this category
      const catId = selectedFilters['category']?.[0] ?? null;
      if (lastPriceFetchCatRef.current !== catId) {
        fetchPriceRange(catId ?? undefined, priceRange);
      }

      // Load subcategories if category is selected
      if (catId) loadSubCategories(catId);
    }
  }, [filterModalVisible]);

  // Track selected category ID separately for reliable useEffect
  const tempSelectedCatId = tempFilters['category']?.[0] ?? null;

  // When category changes in temp filters (user interaction), update subcategories + price range
  const prevTempCatRef = useRef<number | null>(null);
  useEffect(() => {
    if (!filterModalVisible) return;
    // Only react to actual category changes by user, not the initial modal open
    if (prevTempCatRef.current === tempSelectedCatId) return;
    const isInitialOpen = prevTempCatRef.current === null && tempSelectedCatId === (selectedFilters['category']?.[0] ?? null);
    prevTempCatRef.current = tempSelectedCatId;
    if (isInitialOpen) return; // Skip on modal open — handled above

    if (tempSelectedCatId) {
      loadSubCategories(tempSelectedCatId);
      fetchPriceRange(tempSelectedCatId); // Category changed by user → reset price
    } else {
      setSubCategories([]);
      if (activeTab === TAB_SUBCATEGORY) setActiveTab(TAB_CATEGORY);
      fetchPriceRange(); // Category cleared by user → reset price
    }
  }, [tempSelectedCatId, filterModalVisible]);

  // When attribute tab is selected, load its terms
  useEffect(() => {
    if (typeof activeTab === 'number' && !attributeTerms[activeTab]) {
      loadTerms(activeTab);
    }
  }, [activeTab]);

  // ========================
  // DATA LOADING FUNCTIONS
  // ========================

  const [loadingMainCategories, setLoadingMainCategories] = useState(false);

  const loadMainCategories = async () => {
    setLoadingMainCategories(true);
    try {
      const response = await categoryService.getMainCategories();
      setMainCategories(response.data || []);
    } catch (error: any) {
      console.error('Error loading main categories:', error.message || 'Unknown error');
    } finally {
      setLoadingMainCategories(false);
    }
  };

  const loadSubCategories = async (parentId: number) => {
    setLoadingSubCategories(true);
    try {
      const response = await categoryService.getSubCategories(parentId);
      setSubCategories(response.data || []);
    } catch (error: any) {
      console.error('Error loading sub categories:', error.message || 'Unknown error');
    } finally {
      setLoadingSubCategories(false);
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

  // preservePrice: if provided, keep the user's existing selection instead of resetting
  const fetchPriceRange = async (catId?: number, preservePrice?: { min: string; max: string }) => {
    setLoadingPriceRange(true);
    try {
      const baseParams: any = { per_page: 1, status: 'publish' };
      if (catId) baseParams.category = catId.toString();

      const [lowRes, highRes] = await Promise.all([
        productService.getProducts({ ...baseParams, orderby: 'price', order: 'asc' }),
        productService.getProducts({ ...baseParams, orderby: 'price', order: 'desc' }),
      ]);

      const lowProduct = lowRes.data?.[0];
      const highProduct = highRes.data?.[0];

      const newMin = lowProduct ? Math.floor(parseFloat(lowProduct.price) || 0) : 0;
      const rawMax = highProduct ? Math.ceil(parseFloat(highProduct.price) || 10000) : 10000;
      const newMax = rawMax > newMin ? rawMax : newMin + 100;

      setPriceMin(newMin);
      setPriceMax(newMax);
      lastPriceFetchCatRef.current = catId ?? null;

      if (preservePrice && (preservePrice.min || preservePrice.max)) {
        // Clamp user's existing values to the new bounds
        const userLow = preservePrice.min ? Math.max(newMin, parseInt(preservePrice.min)) : newMin;
        const userHigh = preservePrice.max ? Math.min(newMax, parseInt(preservePrice.max)) : newMax;
        setSliderLow(userLow);
        setSliderHigh(userHigh);
        // Keep tempPriceRange as-is (already set by modal open effect)
      } else {
        // Reset slider to full range (category changed or cleared)
        setSliderLow(newMin);
        setSliderHigh(newMax);
        setTempPriceRange({ min: '', max: '' });
      }
    } catch (error) {
      console.error('Error fetching price range:', error);
    } finally {
      setLoadingPriceRange(false);
    }
  };

  // ========================
  // PRODUCT LOADING
  // ========================

  const diffClamp = Animated.diffClamp(scrollY, 0, FILTER_BAR_HEIGHT);
  const filterBarTranslateY = diffClamp.interpolate({
    inputRange: [0, FILTER_BAR_HEIGHT],
    outputRange: [0, -FILTER_BAR_HEIGHT],
  });

  const loadProducts = async (pageToLoad: number, reset: boolean = false, options?: { category?: number | null; search?: string; filters?: Record<string, number[]>; price?: { min: string; max: string } }) => {
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
        order: 'desc',
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

      // Category filter: if subcategories selected, use only those (more specific)
      // If only main category selected, use it (shows all products in that category tree)
      const subCatIds = effectiveFilters['subcategory'] || [];
      const mainCatIds = effectiveFilters['category'] || [];
      if (subCatIds.length > 0) {
        params.category = subCatIds.join(',');
      } else if (mainCatIds.length > 0) {
        params.category = mainCatIds.join(',');
      }

      if (effectiveFilters['tag'] && effectiveFilters['tag'].length > 0) {
        params.tag = effectiveFilters['tag'].join(',');
      }

      const attrParams: string[] = [];
      const termParams: string[] = [];

      Object.entries(effectiveFilters).forEach(([slug, terms]) => {
        if (slug !== 'category' && slug !== 'subcategory' && slug !== 'tag' && terms.length > 0) {
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

  // ========================
  // HANDLERS
  // ========================

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

  // Toggle a single-select filter (category)
  const toggleSingleFilter = (key: string, id: number) => {
    const newFilters = { ...tempFilters };
    if (newFilters[key]?.[0] === id) {
      delete newFilters[key];
      // Clear subcategory when deselecting category
      if (key === 'category') delete newFilters['subcategory'];
    } else {
      newFilters[key] = [id];
      // Clear subcategory when changing category
      if (key === 'category') delete newFilters['subcategory'];
    }
    setTempFilters(newFilters);
  };

  // Toggle a multi-select filter
  const toggleMultiFilter = (key: string, id: number) => {
    const current = tempFilters[key] || [];
    const newFilters = { ...tempFilters };
    if (current.includes(id)) {
      newFilters[key] = current.filter(i => i !== id);
      if (newFilters[key].length === 0) delete newFilters[key];
    } else {
      newFilters[key] = [...current, id];
    }
    setTempFilters(newFilters);
  };

  const closeFilterModal = () => {
    setFilterModalVisible(false);
    prevTempCatRef.current = null;
  };

  const clearAllFilters = () => {
    setTempFilters({});
    setTempPriceRange({ min: '', max: '' });
    setSubCategories([]);
    setActiveTab(TAB_CATEGORY);
    // Re-fetch full price range (no category filter)
    fetchPriceRange();
  };

  const applyFilters = () => {
    closeFilterModal();
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
  };

  const activeFilterCount = Object.values(selectedFilters).reduce((count, arr) => count + (arr?.length || 0), 0)
    + (priceRange.min || priceRange.max ? 1 : 0);

  const tempFilterCount = Object.values(tempFilters).reduce((count, arr) => count + (arr?.length || 0), 0)
    + (tempPriceRange.min || tempPriceRange.max ? 1 : 0);

  // ========================
  // FILTER MODAL HELPERS
  // ========================

  const showSubcategoryTab = !!(tempSelectedCatId && subCategories.length > 0);

  // Reset active tab when subcategory tab disappears
  useEffect(() => {
    if (!showSubcategoryTab && activeTab === TAB_SUBCATEGORY) {
      setActiveTab(TAB_CATEGORY);
    }
  }, [showSubcategoryTab, activeTab]);

  const getFilterTabs = useCallback(() => {
    const tabs: { id: string | number; name: string }[] = [
      { id: TAB_CATEGORY, name: 'Category' },
    ];

    if (showSubcategoryTab) {
      tabs.push({ id: TAB_SUBCATEGORY, name: 'Sub Category' });
    }

    tabs.push({ id: TAB_PRICE, name: 'Price' });

    attributes.forEach(attr => {
      tabs.push({ id: attr.id, name: attr.name });
    });

    return tabs;
  }, [showSubcategoryTab, attributes]);

  const hasTabSelection = (tabId: string | number): boolean => {
    if (tabId === TAB_CATEGORY) return (tempFilters['category']?.length || 0) > 0;
    if (tabId === TAB_SUBCATEGORY) return (tempFilters['subcategory']?.length || 0) > 0;
    if (tabId === TAB_PRICE) return !!tempPriceRange.min || !!tempPriceRange.max;
    // Attribute tabs
    const attr = attributes.find(a => a.id === tabId);
    if (attr) return (tempFilters[attr.slug]?.length || 0) > 0;
    return false;
  };

  // Get label for active filter chips — with fallbacks for route params before data loads
  const getFilterChipLabel = (key: string, id: number): string | null => {
    if (key === 'category') {
      const cat = mainCategories.find(c => c.id === id);
      if (cat) return cat.name;
      // Fallback: route params (covers initial load before mainCategories fetch)
      if (parentCategoryId === id && parentCategoryName) return parentCategoryName;
      if (categoryId === id && categoryName) return categoryName;
      return null;
    }
    if (key === 'subcategory') {
      const sub = subCategories.find(c => c.id === id);
      if (sub) return sub.name;
      // Fallback: if this is the subcategory we navigated from
      if (categoryId === id && categoryName && parentCategoryId) return categoryName;
      return null;
    }
    if (key === 'tag') {
      return tags.find(t => t.id === id)?.name || null;
    }
    // Attribute
    const attr = attributes.find(a => a.slug === key);
    if (attr) {
      const term = attributeTerms[attr.id]?.find(t => t.id === id);
      return term ? `${attr.name}: ${term.name}` : null;
    }
    return null;
  };

  // ========================
  // RENDER
  // ========================

  const renderItem = ({ item }: { item: Product }) => (
    <View style={{ width: CARD_WIDTH, marginBottom: 10 }}>
      <ProductCard
        item={item}
        onPress={handleProductPress}
        onWishlistPress={toggleWishlist}
        isWishlisted={isInWishlist(item.id)}
      />
    </View>
  );

  const renderFilterContent = () => {
    // ---- CATEGORY TAB ----
    if (activeTab === TAB_CATEGORY) {
      return (
        <FlatList
          data={mainCategories.filter(c => (c.count || 0) > 0)}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = tempFilters['category']?.[0] === item.id;
            return (
              <TouchableOpacity
                style={styles.termItem}
                onPress={() => toggleSingleFilter('category', item.id)}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.termText, isSelected && styles.checkedTermText]}>
                  {item.name}
                </Text>
                {item.count ? (
                  <Text style={styles.termCount}>({item.count})</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            loadingMainCategories ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <Text style={styles.emptyTerms}>No categories available</Text>
            )
          }
        />
      );
    }

    // ---- SUBCATEGORY TAB ----
    if (activeTab === TAB_SUBCATEGORY) {
      if (loadingSubCategories) {
        return <ActivityIndicator color={COLORS.primary} size="small" style={{ marginTop: 20 }} />;
      }
      return (
        <FlatList
          data={subCategories.filter(c => (c.count || 0) > 0)}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = tempFilters['subcategory']?.includes(item.id);
            return (
              <TouchableOpacity
                style={styles.termItem}
                onPress={() => toggleMultiFilter('subcategory', item.id)}
              >
                <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
                  {isSelected && <View style={styles.checkboxInner} />}
                </View>
                <Text style={[styles.termText, isSelected && styles.checkedTermText]}>
                  {item.name}
                </Text>
                {item.count ? (
                  <Text style={styles.termCount}>({item.count})</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyTerms}>No sub-categories available</Text>
          }
        />
      );
    }

    // ---- PRICE TAB ----
    if (activeTab === TAB_PRICE) {
      return (
        <View style={styles.priceFilterContainer}>
          <Text style={styles.priceLabel}>Price Range</Text>
          {loadingPriceRange ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <PriceRangeSlider
              min={priceMin}
              max={priceMax}
              low={sliderLow}
              high={sliderHigh}
              step={Math.max(1, Math.floor((priceMax - priceMin) / 100))}
              onValuesChange={(low, high) => {
                setSliderLow(low);
                setSliderHigh(high);
                setTempPriceRange({
                  min: low > priceMin ? low.toString() : '',
                  max: high < priceMax ? high.toString() : '',
                });
              }}
            />
          )}
        </View>
      );
    }

    // ---- ATTRIBUTE TABS ----
    if (typeof activeTab === 'number') {
      if (loadingTerms && !attributeTerms[activeTab]) {
        return <ActivityIndicator color={COLORS.primary} size="small" style={{ marginTop: 20 }} />;
      }

      const activeAttr = attributes.find(a => a.id === activeTab);
      if (!activeAttr) return null;

      return (
        <FlatList
          data={(attributeTerms[activeTab] || []).filter(t => t.count > 0)}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = tempFilters[activeAttr.slug]?.includes(item.id);
            return (
              <TouchableOpacity
                style={styles.termItem}
                onPress={() => toggleMultiFilter(activeAttr.slug, item.id)}
              >
                <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
                  {isSelected && <View style={styles.checkboxInner} />}
                </View>
                <Text style={[styles.termText, isSelected && styles.checkedTermText]}>
                  {item.name}
                </Text>
                <Text style={styles.termCount}>({item.count})</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !loadingTerms ? <Text style={styles.emptyTerms}>No options available</Text> : null
          }
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeftIcon color={COLORS.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <SearchIcon size={18} color={COLORS.text.muted} />
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

      {/* Filter Bar */}
      <Animated.View
        style={[
          styles.filterBar,
          { transform: [{ translateY: filterBarTranslateY }] },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollView}
        >
          {/* Filter button */}
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
          >
            <FilterIcon size={20} color={COLORS.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Active filter chips */}
          {Object.entries(selectedFilters).map(([key, ids]) => {
            if (!ids || ids.length === 0) return null;
            return ids.map(id => {
              const label = getFilterChipLabel(key, id);
              if (!label) return null;
              return (
                <TouchableOpacity
                  key={`${key}-${id}`}
                  style={styles.activeFilterChip}
                  onPress={() => {
                    const newFilters = { ...selectedFilters };
                    const current = newFilters[key] || [];
                    newFilters[key] = current.filter(i => i !== id);
                    if (newFilters[key].length === 0) delete newFilters[key];
                    if (key === 'category') delete newFilters['subcategory'];
                    setSelectedFilters(newFilters);
                    loadProducts(1, true, { filters: newFilters, price: priceRange });
                  }}
                >
                  <Text style={styles.activeFilterText}>{label} ×</Text>
                </TouchableOpacity>
              );
            });
          })}

          {/* Price chip */}
          {(priceRange.min || priceRange.max) ? (
            <TouchableOpacity
              style={styles.activeFilterChip}
              onPress={() => {
                setPriceRange({ min: '', max: '' });
                loadProducts(1, true, { filters: selectedFilters, price: { min: '', max: '' } });
              }}
            >
              <Text style={styles.activeFilterText}>
                AED {priceRange.min || '0'} - AED {priceRange.max || '∞'} ×
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Sort chips */}
          {sortOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortChip, activeSort === option.value && styles.activeSortChip]}
              onPress={() => handleSort(option.value)}
            >
              <Text style={[styles.sortText, activeSort === option.value && styles.activeSortText]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Product List */}
      {loading && !loadingMore ? (
        <ProductListSkeleton />
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={products}
          extraData={wishlistItemIds}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{
            paddingTop: TOTAL_HEADER_HEIGHT + 10,
            paddingHorizontal: 10,
            paddingBottom: 20,
          }}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          maxToRenderPerBatch={20}
          windowSize={21}
          initialNumToRender={10}
          removeClippedSubviews={false}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} /> : null}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} bottom={20} />

      {/* ==================== FILTER MODAL ==================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={closeFilterModal}
          />
          <View style={styles.modalContent}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <View style={styles.modalHeaderActions}>
                {tempFilterCount > 0 && (
                  <TouchableOpacity onPress={clearAllFilters} style={styles.clearBtn}>
                    <Text style={styles.clearText}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={closeFilterModal}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Body - Two Column Layout */}
            <View style={styles.modalBody}>
              <View style={styles.filterContainer}>
                {/* Left Sidebar - Tabs */}
                <View style={styles.filterSidebar}>
                  <FlatList
                    data={getFilterTabs()}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                      const isActive = activeTab === item.id;
                      const hasSelection = hasTabSelection(item.id);

                      return (
                        <TouchableOpacity
                          style={[styles.attributeTab, isActive && styles.activeAttributeTab]}
                          onPress={() => setActiveTab(item.id)}
                        >
                          <Text
                            style={[styles.attributeTabText, isActive && styles.activeAttributeTabText]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          {hasSelection && <View style={styles.filterDot} />}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>

                {/* Right Content */}
                <View style={styles.filterContent}>
                  {renderFilterContent()}
                </View>
              </View>
            </View>

            {/* Apply Button */}
            <View style={styles.applyContainer}>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>
                  Show Results{tempFilterCount > 0 ? ` (${tempFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
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
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.display.bold,
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
  emptyText: {
    fontSize: 16,
    color: '#666',
  },

  // ==================== FILTER MODAL ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouch: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '82%',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: FONTS.serif.bold,
    color: COLORS.text.main,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  clearText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: FONTS.display.medium,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: COLORS.text.muted,
    lineHeight: 20,
  },
  modalBody: {
    flex: 1,
  },
  filterContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  filterSidebar: {
    width: '34%',
    backgroundColor: '#f7f7f8',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  attributeTab: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeAttributeTab: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  attributeTabText: {
    fontSize: 13,
    color: '#666',
    fontFamily: FONTS.display.medium,
    flex: 1,
  },
  activeAttributeTabText: {
    color: COLORS.primary,
    fontFamily: FONTS.display.bold,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  // Checkbox (multi-select)
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },
  // Radio (single-select)
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  termText: {
    fontSize: 14,
    color: '#333',
    fontFamily: FONTS.display.regular,
    flex: 1,
  },
  checkedTermText: {
    color: COLORS.primary,
    fontFamily: FONTS.display.semiBold,
  },
  termCount: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: FONTS.display.regular,
    marginLeft: 4,
  },
  emptyTerms: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontFamily: FONTS.display.regular,
  },
  priceFilterContainer: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  priceLabel: {
    fontSize: 16,
    fontFamily: FONTS.display.bold,
    color: COLORS.text.main,
    marginBottom: 8,
  },
  applyContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
});
