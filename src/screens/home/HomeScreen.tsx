import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, RefreshControl, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useCartStore } from '../../store/cartStore';
import { useHomeStore } from '../../store/homeStore';
import { useUserStore } from '../../store/userStore';
import { RootStackParamList } from '../../navigation/types';
import layoutService from '../../services/layoutService';
import { HomeLayoutSection } from '../../types';

// Components
import { BannerSection } from '../../components/home/BannerSection';
import { ProductSliderSection } from '../../components/home/ProductSliderSection';
import { ProductGridSection } from '../../components/home/ProductGridSection';
import { CategoryGridSection } from '../../components/home/CategoryGridSection';
import { BrandGridSection } from '../../components/home/BrandGridSection';
import { HomeSkeleton } from '../../components/skeletons/HomeSkeleton';

import { HomeHeader } from '../../components/home/HomeHeader';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import { CategoryCircleSection } from '../../components/home/CategoryCircleSection';
import { PromoBanner } from '../../components/home/PromoBanner';
import { FlashSaleSection } from '../../components/home/FlashSaleSection';
import { TrendingVideosSection } from '../../components/home/TrendingVideosSection';
import { RewardProgramCard } from '../../components/home/RewardProgramCard';
import { ScrollToTopButton } from '../../components/common/ScrollToTopButton';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [layout, setLayout] = useState<HomeLayoutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { itemCount } = useCartStore();
  const { layout: cachedLayout, popularProducts: cachedProducts, setHomeData, isCacheValid } = useHomeStore();
  const { user } = useUserStore();
  const listRef = useRef<FlashList<any>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    setShowScrollTop(y > 600);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadLayout = async () => {
    try {
      const data = await layoutService.getHomeLayout();
      if (data) {
        setLayout(data);
        setLoading(false);
      }
      return data;
    } catch (error) {
      console.error('Error loading home layout:', error);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      if (cachedLayout.length > 0 && isCacheValid()) {
        setLayout(cachedLayout);
        setLoading(false);
      }

      const layoutData = await loadLayout();

      if (layoutData) {
        setHomeData(layoutData, cachedProducts);
      }
    };
    init();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLayout().then(() => setRefreshing(false));
  }, []);

  // Process layout sections into renderable data
  const flatListData = useMemo(() => {
    return layout.map((section, index) => {
      const processed: any = { ...section, isSection: true, _key: `section-${index}-${section.type}` };
      const d = section.data as any;

      // For all product types, build a simple dataSource
      if (
        section.type === 'product_slider' ||
        section.type === 'product_slider_image' ||
        section.type === 'product_grid_2x2' ||
        section.type === 'product_grid_2x2_image' ||
        section.type === 'product_grid_3x3' ||
        section.type === 'product_grid_3x3_image'
      ) {
        if (d.ids) {
          processed.dataSource = { type: 'ids', ids: d.ids };
        }
      }

      // Legacy support: old "product_list" type
      if (section.type === 'product_list') {
        const queryType = d.query_type;
        const apiParams = d.api_params || {};

        let dataSource: any = { type: 'filter', key: 'date' };

        if (queryType === 'ids') {
          if (d.ids) {
            dataSource = { type: 'ids', ids: d.ids };
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
        processed.dataSource = dataSource;
      }

      return processed;
    });
  }, [layout]);

  const handleSearchPress = () => {
    navigation.navigate('ProductList', {});
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (!item.isSection) return null;
    const d = item.data as any;

    switch (item.type) {
      // ===== BANNER / CAROUSEL =====
      case 'hero_carousel':
        return (
          <View style={{ minHeight: 420 }}>
            <HeroCarousel
              slides={d.slides || []}
              autoPlayInterval={d.autoPlayInterval}
            />
          </View>
        );

      case 'hero_banner':
        return (
          <View style={{ minHeight: 200 }}>
            <BannerSection
              imageUrl={d.imageUrl || ''}
              action={d.action}
            />
          </View>
        );

      case 'promo_banner':
        return (
          <PromoBanner
            imageUrl={d.imageUrl}
            title={d.title}
            titleAccent={d.titleAccent}
            description={d.description}
            ctaText={d.ctaText}
            action={d.action}
          />
        );

      // ===== CATEGORY =====
      case 'category_circles':
        return (
          <CategoryCircleSection
            title={item.title || 'Categories'}
            categories={d.ids}
            images={d.images}
          />
        );

      case 'category_grid':
        return (
          <View style={{ minHeight: 140 }}>
            <CategoryGridSection
              title={item.title || 'Categories'}
              categories={d.ids}
              images={d.images}
            />
          </View>
        );

      // ===== BRAND =====
      case 'brand_grid':
        return (
          <View style={{ minHeight: 140 }}>
            <BrandGridSection
              title={item.title || 'Top Brands'}
              ids={d.ids}
              images={d.images}
            />
          </View>
        );

      // ===== VIDEO =====
      case 'trending_videos':
        return (
          <TrendingVideosSection
            title={item.title || 'Trending Now'}
            videos={d.videos || []}
          />
        );

      // ===== FLASH SALE =====
      case 'flash_sale':
        return (
          <FlashSaleSection
            title={item.title}
            endTime={d.endTime}
            productIds={d.products?.ids}
          />
        );

      // ===== REWARD CARD =====
      case 'reward_card':
        return (
          <RewardProgramCard
            title={d.title}
            description={d.description}
            ctaText={d.ctaText}
          />
        );

      // ===== 6 PRODUCT LAYOUTS =====

      // 1. Product Slider — default card (name, price, wishlist)
      case 'product_slider':
        return (
          <ProductSliderSection
            title={item.title || 'Products'}
            dataSource={item.dataSource}
            layout="slider_2_5"
            cardStyle="compact"
          />
        );

      // 2. Product Slider — custom images (image-only cards)
      case 'product_slider_image':
        return (
          <ProductSliderSection
            title={item.title || 'Products'}
            dataSource={item.dataSource}
            images={d.images}
            layout="slider_2_5"
            cardStyle="image_only"
          />
        );

      // 3. Grid 2x2 — default card
      case 'product_grid_2x2':
        return (
          <ProductGridSection
            title={item.title}
            dataSource={item.dataSource}
            columns={2}
            withContainer={true}
            containerColor={d.background || '#F8F5F0'}
            cardStyle="default"
          />
        );

      // 4. Grid 2x2 — custom images
      case 'product_grid_2x2_image':
        return (
          <ProductGridSection
            title={item.title}
            dataSource={item.dataSource}
            images={d.images}
            columns={2}
            withContainer={true}
            containerColor={d.background || '#F8F5F0'}
            cardStyle="image_only"
          />
        );

      // 5. Grid 3x3 — default card
      case 'product_grid_3x3':
        return (
          <ProductGridSection
            title={item.title}
            dataSource={item.dataSource}
            columns={3}
            withContainer={true}
            containerColor={d.background || '#F8F5F0'}
            cardStyle="default"
          />
        );

      // 6. Grid 3x3 — custom images
      case 'product_grid_3x3_image':
        return (
          <ProductGridSection
            title={item.title}
            dataSource={item.dataSource}
            images={d.images}
            columns={3}
            withContainer={true}
            containerColor={d.background || '#F8F5F0'}
            cardStyle="image_only"
          />
        );

      // ===== LEGACY: old product_list (still supported) =====
      case 'product_list': {
        const layoutType = d.layout;

        if (layoutType && (layoutType.startsWith('grid_3_col') || layoutType.startsWith('grid_2_col'))) {
          return (
            <ProductGridSection
              title={item.title}
              dataSource={item.dataSource}
              images={d.images}
              withContainer={layoutType.includes('container')}
              columns={layoutType.startsWith('grid_2_col') ? 2 : 3}
              cardStyle={d.card_style === 'image_only' ? 'image_only' : 'default'}
            />
          );
        }

        return (
          <ProductSliderSection
            title={item.title || 'Products'}
            dataSource={item.dataSource}
            images={d.images}
            layout="slider_2_5"
            cardStyle={d.card_style}
          />
        );
      }

      default:
        return null;
    }
  }, []);

  return (
    <View style={styles.container}>
      <HomeHeader
        onSearchPress={handleSearchPress}
        userAvatar={user?.avatar}
        userName={user?.firstName || 'Guest'}
        isOnline={true}
      />

      {loading ? (
        <HomeSkeleton />
      ) : (
        <FlashList
          ref={listRef}
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item) => item._key}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          drawDistance={400}
          estimatedItemSize={350}
        />
      )}
      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
});
