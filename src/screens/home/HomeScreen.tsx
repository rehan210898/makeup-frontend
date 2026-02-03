import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, Dimensions } from 'react-native';
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

// Existing Components
import { BannerSection } from '../../components/home/BannerSection';
import { ProductSliderSection } from '../../components/home/ProductSliderSection';
import { ProductGridSection } from '../../components/home/ProductGridSection';
import { CategoryGridSection } from '../../components/home/CategoryGridSection';
import { FashionMicroAnimations } from '../../components/home/FashionMicroAnimations';
import { BeautyMicroAnimations } from '../../components/home/BeautyMicroAnimations';
import { BrandGridSection } from '../../components/home/BrandGridSection';
import { FloatingIconsBackground } from '../../components/home/FloatingIconsBackground';
import { HomeSkeleton } from '../../components/skeletons/HomeSkeleton';
import { GlassView } from '../../components/common/GlassView';

// New Stitch UI Components
import { HomeHeader } from '../../components/home/HomeHeader';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import { CategoryCircleSection } from '../../components/home/CategoryCircleSection';
import { PromoBanner } from '../../components/home/PromoBanner';
import { FlashSaleSection } from '../../components/home/FlashSaleSection';
import { TrendingVideosSection } from '../../components/home/TrendingVideosSection';
import { TopRatedSection } from '../../components/home/TopRatedSection';
import { EditorsChoiceSection } from '../../components/home/EditorsChoiceSection';
import { RewardProgramCard } from '../../components/home/RewardProgramCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [layout, setLayout] = useState<HomeLayoutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { itemCount } = useCartStore();
  const { layout: cachedLayout, popularProducts: cachedProducts, setHomeData } = useHomeStore();
  const { user } = useUserStore();

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
      // Load from cache immediately
      if (cachedLayout.length > 0) {
        setLayout(cachedLayout);
        setLoading(false);
      }

      // Fetch fresh data in background
      const layoutData = await loadLayout();

      // Update cache if successful
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

  const flatListData = useMemo(() => {
    const data: any[] = layout.map((section, index) => {
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
        (processedSection as any).dataSource = dataSource;
      }

      return processedSection;
    });

    return data;
  }, [layout]);

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleSearchPress = () => {
    navigation.navigate('ProductList', {});
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.isSection) {
      switch (item.type) {
        // New Stitch UI Components
        case 'hero_carousel':
          return (
            <View style={{ minHeight: 420 }}>
              <HeroCarousel
                slides={(item.data as any).slides || []}
                autoPlayInterval={(item.data as any).autoPlayInterval}
              />
            </View>
          );

        case 'category_circles':
          return (
            <CategoryCircleSection
              title={item.title || 'Categories'}
              categories={(item.data as any).ids}
              images={(item.data as any).images}
            />
          );

        case 'promo_banner':
          return (
            <PromoBanner
              imageUrl={(item.data as any).imageUrl}
              title={(item.data as any).title}
              titleAccent={(item.data as any).titleAccent}
              description={(item.data as any).description}
              ctaText={(item.data as any).ctaText}
              action={(item.data as any).action}
            />
          );

        case 'flash_sale':
          return (
            <FlashSaleSection
              title={item.title}
              endTime={(item.data as any).endTime}
              productIds={(item.data as any).products?.ids}
            />
          );

        case 'trending_videos':
          return (
            <TrendingVideosSection
              title={item.title || 'Trending Now'}
              videos={(item.data as any).videos || []}
            />
          );

        case 'top_rated':
          return (
            <TopRatedSection
              title={item.title || 'Top Rated Favorites'}
              productIds={(item.data as any).ids}
            />
          );

        case 'editors_choice':
          return (
            <EditorsChoiceSection
              title={item.title || "Editor's Choice"}
              productIds={(item.data as any).ids}
            />
          );

        case 'reward_card':
          return (
            <RewardProgramCard
              title={(item.data as any).title}
              description={(item.data as any).description}
              ctaText={(item.data as any).ctaText}
            />
          );

        // Existing Components
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
            <GlassView style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitleText}>
                {(item.data as any).text}
              </Text>
            </GlassView>
          );

        case 'product_list':
          const layoutType = (item.data as any).layout;

          if (layoutType && layoutType.startsWith('grid_3_col')) {
            return (
              <ProductGridSection
                title={item.title}
                dataSource={(item as any).dataSource}
                withContainer={layoutType.includes('container')}
              />
            );
          }

          return (
            <View style={{ minHeight: 320 }}>
              <ProductSliderSection
                title={item.title || 'Products'}
                dataSource={(item as any).dataSource}
                images={(item.data as any).images}
                layout={layoutType}
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
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item) => item._key}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          drawDistance={500}
          estimatedItemSize={300}
        />
      )}
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
  sectionTitleContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  sectionTitleText: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 20,
    color: COLORS.primary,
  },
});
