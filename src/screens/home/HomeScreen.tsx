import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { useCartStore } from '../../store/cartStore';
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
import { GlassView } from '../../components/common/GlassView';
import ProductCard from '../../components/products/ProductCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 50) / 2;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [layout, setLayout] = useState<HomeLayoutSection[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { itemCount } = useCartStore();

  const loadLayout = async () => {
    try {
      const data = await layoutService.getHomeLayout();
      setLayout(data || []);
    } catch (error) {
      console.error('Error loading home layout:', error);
    }
  };

  const loadPopularProducts = async (pageNum: number, isRefresh: boolean = false) => {
    if (loadingMore || (!hasMore && !isRefresh)) return;
    
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
      } else {
        setPopularProducts(prev => [...prev, ...newProducts]);
      }
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Error loading popular products:', error);
    } finally {
      setLoadingMore(false);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
        await loadLayout();
        await loadPopularProducts(1, true);
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
    const data: any[] = layout.map(section => ({ ...section, isSection: true }));
    
    if (popularProducts.length > 0) {
      data.push({ isTitle: true, title: '🔥 Popular Products' });
      
      // We chunk products into pairs for a 2-column grid within a single-column FlatList
      for (let i = 0; i < popularProducts.length; i += 2) {
        data.push({
          isProductRow: true,
          products: popularProducts.slice(i, i + 2)
        });
      }
    }
    
    return data;
  }, [layout, popularProducts]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.isTitle) {
      return (
        <View style={{ paddingHorizontal: 20, marginBottom: 15, marginTop: 25 }}>
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
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      );
    }

    if (item.isSection) {
        switch (item.type) {
        case 'hero_banner':
            return <BannerSection 
            imageUrl={(item.data as any).imageUrl || ''} 
            action={(item.data as any).action} 
            />;
        case 'micro_animation':
            return <FashionMicroAnimations />;
        case 'beauty_animation':
            return <BeautyMicroAnimations />;
        case 'section_title':
            return (
            <GlassView style={{ marginHorizontal: 20, marginBottom: 15, marginTop: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.4)' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary }}>
                {(item.data as any).text}
                </Text>
            </GlassView>
            );
        case 'product_list':
            const listData = item.data as any;
            const queryType = listData.query_type;
            const apiParams = listData.api_params || {};
            
            let dataSource: any = { type: 'filter', key: 'date' }; // Default to latest
            
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
            
            return <ProductSliderSection title={item.title || 'Products'} dataSource={dataSource} images={listData.images} />;
        case 'category_grid':
            const gridData = item.data as any;
            return <CategoryGridSection title={item.title || 'Categories'} categories={gridData.ids} images={gridData.images} />;
        case 'brand_grid':
            const brandData = item.data as any;
            return <BrandGridSection title={item.title || 'Top Brands'} ids={brandData.ids} images={brandData.images} />;
        default:
            return null;
        }
    }

    return null;
  };

  const renderHeader = () => (
    <View style={styles.welcomeContainer}>
       <GlassView style={styles.welcomeBox}>
        <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
        <Text style={styles.welcomeText}>Discover amazing products</Text>
      </GlassView>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
});
