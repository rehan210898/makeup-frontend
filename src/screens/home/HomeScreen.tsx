import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Platform, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { useCartStore } from '../../store/cartStore';
import { RootStackParamList } from '../../navigation/types';
import SearchIcon from '../../components/icons/SearchIcon';
import layoutService from '../../services/layoutService';
import { HomeLayoutSection } from '../../types';
import { BannerSection } from '../../components/home/BannerSection';
import { ProductSliderSection } from '../../components/home/ProductSliderSection';
import { CategoryGridSection } from '../../components/home/CategoryGridSection';
import { FashionMicroAnimations } from '../../components/home/FashionMicroAnimations';
import { BeautyMicroAnimations } from '../../components/home/BeautyMicroAnimations';
import { FloatingIconsBackground } from '../../components/home/FloatingIconsBackground';
import { HomeSkeleton } from '../../components/skeletons/HomeSkeleton';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [layout, setLayout] = useState<HomeLayoutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { itemCount } = useCartStore();

  const loadLayout = async () => {
    try {
      const data = await layoutService.getHomeLayout();
      setLayout(data || []);
    } catch (error) {
      console.error('Error loading home layout:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLayout();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLayout();
  }, []);

  const renderSection = ({ item, index }: { item: HomeLayoutSection; index: number }) => {
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
          <View style={{ paddingHorizontal: 20, marginBottom: 15, marginTop: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary }}>
              {(item.data as any).text}
            </Text>
          </View>
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
        
        // Pass item.title if available
        return <ProductSliderSection title={item.title || 'Products'} dataSource={dataSource} images={listData.images} />;
import { CategoryGridSection } from '../../components/home/CategoryGridSection';
import { BrandGridSection } from '../../components/home/BrandGridSection';
import { FashionMicroAnimations } from '../../components/home/FashionMicroAnimations';

// ... (inside renderSection switch)
      case 'category_grid':
        const gridData = item.data as any;
        return <CategoryGridSection title={item.title || 'Categories'} categories={gridData.ids} images={gridData.images} />;
      case 'brand_grid':
        const brandData = item.data as any;
        return <BrandGridSection title={item.title || 'Top Brands'} ids={brandData.ids} images={brandData.images} />;
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <View style={styles.welcomeContainer}>
       <View style={[styles.welcomeBox, { backgroundColor: COLORS.accentLight }]}>
        <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
        <Text style={styles.welcomeText}>Discover amazing products</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FloatingIconsBackground />
      {/* Header - Fixed at top */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>🏠 Home</Text>
          <View style={[styles.cartBadge, { backgroundColor: COLORS.accent }]}>
            <Text style={styles.cartBadgeText}>🛒 {itemCount}</Text>
          </View>
        </View>
        
        {/* Search Bar Fixed in Header */}
        <TouchableOpacity 
          style={styles.headerSearchBar} 
          onPress={() => navigation.navigate('ProductList', {})}
          activeOpacity={0.9}
        >
          <SearchIcon size={20} color="#999" />
          <Text style={[styles.headerSearchPlaceholder, { marginLeft: 8 }]}>Search products...</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <HomeSkeleton />
      ) : (
        <FlatList
          data={layout}
          renderItem={renderSection}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
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
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
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
    color: COLORS.cream,
  },
  cartBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.cream,
  },
  headerSearchBar: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSearchPlaceholder: {
    color: '#999',
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    paddingBottom: 100,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
  },
  welcomeBox: {
    marginBottom: 25,
    marginTop: 10,
    padding: 15, // Added padding
    borderRadius: 12, // Added radius
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
});
