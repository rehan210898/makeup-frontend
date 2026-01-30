import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { useCartStore } from '../../store/cartStore';
import { useHomeStore } from '../../store/homeStore';
import { RootStackParamList } from '../../navigation/types';
import SearchIcon from '../../components/icons/SearchIcon';
import layoutService from '../../services/layoutService';
import productService from '../../services/productService';
import { HomeLayoutSection, Product } from '../../types';
import { BannerSection } from '../../components/home/BannerSection';
import { ProductSliderSection } from '../../components/home/ProductSliderSection';
import { CategoryGridSection } from '../../components/home/CategoryGridSection';
import { FashionMicroAnimations } from '../../components/home/FashionMicroAnimations';
import { BeautyMicroAnimations } from '../../components/home/BeautyMicroAnimations';
import { BrandGridSection } from '../../components/home/BrandGridSection';
import { FloatingIconsBackground } from '../../components/home/FloatingIconsBackground';
import { HomeSkeleton } from '../../components/skeletons/HomeSkeleton';
import { ProductCardSkeleton } from '../../components/skeletons/ProductCardSkeleton';
import { GlassView } from '../../components/common/GlassView';
import ProductCard from '../../components/products/ProductCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
// Adjusted for 2 columns: (Screen Width - Padding) / 2
const COLUMN_WIDTH = Math.floor((width - 30) / 2); 

const PRODUCT_ROW_HEIGHT = 280; // Only used for estimation if needed, but removed from render
const SECTION_EST_HEIGHT = 400;
const TITLE_HEIGHT = 80; // Title + margins

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  // ... state ...
  const [layout, setLayout] = useState<HomeLayoutSection[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { itemCount } = useCartStore();
  const { layout: cachedLayout, popularProducts: cachedProducts, setHomeData, setPopularProducts: setCachedPopularProducts } = useHomeStore();

  // ... load functions ...
  const loadLayout = async () => {
    try {
      const data = await layoutService.getHomeLayout();
      if (data) {
        setLayout(data);
        // We only persist if we also have popular products, or update partially?
        // Let's update partially or wait. The store has a combined setter.
        // We can just rely on the combined state update later or create separate setters.
        // For now, let's keep local state in sync.
      }
      return data;
    } catch (error) {
      console.error('Error loading home layout:', error);
      return null;
    }
  };

  const loadPopularProducts = async (pageNum: number, isRefresh: boolean = false) => {
    // Stop if we already have 60 or more products
    if (loadingMore || (!hasMore && !isRefresh)) return;
    
    // If we're not refreshing and already hit the limit, stop.
    if (!isRefresh && popularProducts.length >= 60) {
        setHasMore(false);
        return;
    }

    setLoadingMore(true);
    try {
      const response = await productService.getProducts({
        orderby: 'popularity',
        order: 'desc',
        page: pageNum,
        per_page: 10
      });
      
      const newProducts = response.data || [];
      if (newProducts.length < 10) {
          setHasMore(false);
      }
      
      if (isRefresh) {
        setPopularProducts(newProducts);
        // We persist only the first page/batch usually to keep startup fast
        // But here we might want to persist what we have.
      } else {
        setPopularProducts(prev => {
            const updated = [...prev, ...newProducts];
            // Enforce hard limit of 60
            if (updated.length >= 60) {
                setHasMore(false);
                return updated.slice(0, 60);
            }
            return updated;
        });
      }
      setPage(pageNum + 1);
      return newProducts;
    } catch (error) {
      console.error('Error loading popular products:', error);
      return null;
    } finally {
      setLoadingMore(false);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
        // 1. Load from Cache immediately
        if (cachedLayout.length > 0) {
            setLayout(cachedLayout);
            setLoading(false); // Show content immediately
        }
        if (cachedProducts.length > 0) {
            setPopularProducts(cachedProducts);
        }

        // 2. Fetch Fresh Data in Background
        const layoutData = await loadLayout();
        const productsData = await loadPopularProducts(1, true);

        // 3. Update Cache if successful
        if (layoutData && productsData) {
            setHomeData(layoutData, productsData);
        } else if (layoutData) {
            // If only layout loaded (e.g. products failed), still update layout?
            // For simplicity, we use the combined setter only when both succeed initially, 
            // or we could add separate setters to the store.
            // Let's assume initialized successfully.
             setHomeData(layoutData, productsData || cachedProducts);
        }
    };
    init();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadLayout();
    loadPopularProducts(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadPopularProducts(page);
    }
  };

  // Combine layout sections and popular products into a single list
  const flatListData = useMemo(() => {
    const data: any[] = layout.map((section, index) => {
      // Pre-calculate dataSource for ProductSliderSection here to ensure stability
      let processedSection = { ...section, isSection: true, _key: `section-${index}-${section.type}` };
      
      if (section.type === 'product_list') {
        const listData = section.data as any;
        const queryType = listData.query_type;
        const apiParams = listData.api_params || {};
        
        let dataSource: any = { type: 'filter', key: 'date' };
        
        if (queryType === 'ids') {
          if (listData.ids) {
            dataSource = { type: 'ids', ids: listData.ids };
          } else if (apiParams.include) {
            dataSource = { type: 'ids', ids: apiParams.include };
          }
        } else if (queryType === 'category' && apiParams.category) {
          dataSource = { type: 'filter', key: 'category', value: apiParams.category };
        } else if (queryType === 'best_selling') {
          dataSource = { type: 'filter', key: 'popularity' };
        } else if (queryType === 'on_sale') {
          dataSource = { type: 'filter', key: 'on_sale' };
        } else if (queryType === 'featured') {
          dataSource = { type: 'filter', key: 'featured' };
        } else if (queryType === 'top_rated') {
          dataSource = { type: 'filter', key: 'rating' };
        }
        // Attach the calculated dataSource to the item
        (processedSection as any).dataSource = dataSource;
      }
      
      return processedSection;
    });
    
    if (popularProducts.length > 0) {
      data.push({ 
        isTitle: true, 
        title: '🔥 Popular Products',
        _key: 'title-popular'
      });
      
      // We chunk products into pairs for a 2-column grid
      for (let i = 0; i < popularProducts.length; i += 2) {
        data.push({
          isProductRow: true,
          products: popularProducts.slice(i, i + 2),
          _key: `prod-row-${i}`
        });
      }
    }
    
    return data;
  }, [layout, popularProducts]);

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  };
  
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.isTitle) {
      return (
        <View style={{ paddingHorizontal: 20, marginBottom: 15, marginTop: 25, height: TITLE_HEIGHT - 40 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary }}>
            {item.title}
          </Text>
        </View>
      );
    }

    if (item.isProductRow) {
      return (
        <View style={styles.productRow}>
          {item.products.map((product: Product) => (
            <View key={product.id} style={{ width: COLUMN_WIDTH }}>
              <ProductCard 
                item={product} 
                onPress={handleProductPress}
              />
            </View>
          ))}
        </View>
      );
    }

    if (item.isSection) {
        // ... switch case ...
        switch (item.type) {
        case 'hero_banner':
            return (
              <View style={{ minHeight: 200 }}>
                <BannerSection 
                  imageUrl={(item.data as any).imageUrl || ''} 
                  action={(item.data as any).action} 
                />
              </View>
            );
        case 'micro_animation':
            return <View style={{ minHeight: 100 }}><FashionMicroAnimations /></View>;
        case 'beauty_animation':
            return <View style={{ minHeight: 100 }}><BeautyMicroAnimations /></View>;
        case 'section_title':
            return (
            <GlassView style={{ marginHorizontal: 20, marginBottom: 15, marginTop: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.4)' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary }}>
                {(item.data as any).text}
                </Text>
            </GlassView>
            );
        case 'product_list':
            // Use the pre-calculated dataSource
            return (
              <View style={{ minHeight: 320 }}>
                <ProductSliderSection 
                  title={item.title || 'Products'} 
                  dataSource={(item as any).dataSource} 
                  images={(item.data as any).images} 
                />
              </View>
            );
        case 'category_grid':
            const gridData = item.data as any;
            return (
              <View style={{ minHeight: 140 }}>
                <CategoryGridSection 
                  title={item.title || 'Categories'} 
                  categories={gridData.ids} 
                  images={gridData.images} 
                />
              </View>
            );
        case 'brand_grid':
            const brandData = item.data as any;
            return (
              <View style={{ minHeight: 140 }}>
                <BrandGridSection 
                  title={item.title || 'Top Brands'} 
                  ids={brandData.ids} 
                  images={brandData.images} 
                />
              </View>
            );
        default:
            return null;
        }
    }

    return null;
  }, [handleProductPress]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 15 }}>
         <View style={{ width: COLUMN_WIDTH }}>
            <ProductCardSkeleton variant="home" />
         </View>
         <View style={{ width: COLUMN_WIDTH }}>
            <ProductCardSkeleton variant="home" />
         </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FloatingIconsBackground />
      <GlassView style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>🏠 Home</Text>
          <View style={[styles.cartBadge, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
            <Text style={[styles.cartBadgeText, { color: COLORS.primary }]}>🛒 {itemCount}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.headerSearchBar} 
          onPress={() => navigation.navigate('ProductList', {})}
          activeOpacity={0.9}
        >
          <SearchIcon size={20} color="#666" />
          <Text style={[styles.headerSearchPlaceholder, { marginLeft: 8 }]}>Search products...</Text>
        </TouchableOpacity>
      </GlassView>

      {loading && page === 1 ? (
        <HomeSkeleton />
      ) : (
        <FlatList
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item) => item._key}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={10} // Reduced slightly to balance memory/smoothness
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cartBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerSearchBar: {
    backgroundColor: 'rgba(255,255,255,0.7)', 
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSearchPlaceholder: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    paddingBottom: 100,
    paddingTop: 10,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
  },
  welcomeBox: {
    marginBottom: 25,
    marginTop: 10,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'stretch', // Stretch to equal height
    paddingHorizontal: 10,
    gap: 10,
    marginBottom: 15,
  },
});