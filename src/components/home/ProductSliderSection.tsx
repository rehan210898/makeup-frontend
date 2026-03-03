import React, { useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';
import { ProductCardSkeleton } from '../skeletons/ProductCardSkeleton';
import { useWishlistStore } from '../../store/wishlistStore';

interface ProductSliderSectionProps {
  title?: string;
  dataSource?: {
    type: 'filter' | 'ids';
    key?: string;
    ids?: number[];
    value?: string | number;
  };
  images?: string[];
  layout?: string;
  cardStyle?: 'default' | 'compact' | 'image_only';
}

const { width } = Dimensions.get('window');
const GAP = 10;

// Build a stable query key from dataSource
function buildQueryKey(dataSource?: ProductSliderSectionProps['dataSource'], images?: string[]) {
  if (!dataSource) return ['products', 'slider', 'none'];
  if (dataSource.type === 'ids') {
    return ['products', 'slider', 'ids', dataSource.ids?.join(',') || ''];
  }
  return ['products', 'slider', 'filter', dataSource.key || '', String(dataSource.value || '')];
}

// Fetch function for the query
async function fetchSliderProducts(
  dataSource: ProductSliderSectionProps['dataSource'],
  images?: string[]
): Promise<Product[]> {
  if (!dataSource) return [];

  let response: any;

  if (dataSource.type === 'ids' && dataSource.ids?.length) {
    response = await productService.getProducts({
      // @ts-ignore
      include: dataSource.ids,
    });

    // Apply image overrides and sort by ID order
    if (response?.data && images && images.length > 0) {
      const ids = dataSource.ids;
      const sorted = response.data.sort(
        (a: any, b: any) => ids.indexOf(a.id) - ids.indexOf(b.id)
      );
      response.data = sorted.map((p: any) => {
        const originalIndex = ids.indexOf(p.id);
        if (originalIndex !== -1 && images[originalIndex]) {
          return { ...p, images: [{ src: images[originalIndex] }] };
        }
        return p;
      });
    }
  } else if (dataSource.type === 'filter') {
    const filters: any = { per_page: 6 };

    if (dataSource.key === 'popularity') filters.orderby = 'popularity';
    else if (dataSource.key === 'date') filters.orderby = 'date';
    else if (dataSource.key === 'rating') filters.orderby = 'rating';
    else if (dataSource.key === 'featured') filters.featured = true;
    else if (dataSource.key === 'on_sale') filters.on_sale = true;
    else if (dataSource.key === 'category' && dataSource.value) {
      if (typeof dataSource.value === 'string' && isNaN(Number(dataSource.value))) {
        const catResponse = await categoryService.getCategoryBySlug(dataSource.value);
        if (catResponse.data?.[0]) {
          filters.category = catResponse.data[0].id;
        } else {
          return [];
        }
      } else {
        filters.category = dataSource.value;
      }
    }

    response = await productService.getProducts(filters);
  }

  return response?.data || [];
}

const ProductSliderSectionComponent: React.FC<ProductSliderSectionProps> = ({
  title,
  dataSource,
  images,
  layout,
  cardStyle,
}) => {
  const navigation = useNavigation<any>();
  const { itemIds: wishlistItemIds, addItem, removeItem } = useWishlistStore();

  const isCompactSlider = layout === 'slider_2_5';
  const CARD_WIDTH = isCompactSlider ? width / 2.5 : width / 2 - 20;

  // Use React Query for caching and deduplication
  const queryKey = useMemo(() => buildQueryKey(dataSource, images), [dataSource, images]);

  const { data: products = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchSliderProducts(dataSource, images),
    enabled: !!dataSource,
    staleTime: 1000 * 60 * 10, // 10 minutes for home page sections
  });

  const handleProductPress = useCallback(
    (id: number) => {
      navigation.navigate('ProductDetail', { productId: id });
    },
    [navigation]
  );

  const toggleWishlist = useCallback(
    (id: number) => {
      const isWishlisted = wishlistItemIds.includes(id);
      if (isWishlisted) {
        removeItem(id);
      } else {
        const product = products.find((p) => p.id === id);
        if (product) addItem(product);
      }
    },
    [wishlistItemIds, products, addItem, removeItem]
  );

  const renderSkeletonItem = useCallback(
    () => (
      <View style={{ width: CARD_WIDTH, marginRight: GAP }}>
        <ProductCardSkeleton variant={isCompactSlider ? 'compact' : 'default'} />
      </View>
    ),
    [CARD_WIDTH, isCompactSlider]
  );

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <View style={{ width: CARD_WIDTH, marginRight: GAP }}>
        <ProductCard
          item={item}
          onPress={handleProductPress}
          onWishlistPress={toggleWishlist}
          isWishlisted={wishlistItemIds.includes(item.id)}
          hidePrice={!!images && images.length > 0}
          variant={(cardStyle as any) || (isCompactSlider ? 'compact' : 'default')}
          index={index}
        />
      </View>
    ),
    [CARD_WIDTH, handleProductPress, images, toggleWishlist, wishlistItemIds, isCompactSlider, cardStyle]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
        <View>
          <FlashList
            horizontal
            data={[1, 2, 3]}
            keyExtractor={(item) => item.toString()}
            renderItem={renderSkeletonItem}
            contentContainerStyle={styles.listContent}
            showsHorizontalScrollIndicator={false}
            estimatedItemSize={CARD_WIDTH + GAP}
          />
        </View>
      </View>
    );
  }

  if (!products.length) return null;

  return (
    <View style={styles.container}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <View>
        <FlashList
          horizontal
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + GAP}
          decelerationRate="fast"
          snapToAlignment="start"
          estimatedItemSize={CARD_WIDTH + GAP}
        />
      </View>
    </View>
  );
};

export const ProductSliderSection = memo(
  ProductSliderSectionComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.layout === nextProps.layout &&
      prevProps.cardStyle === nextProps.cardStyle &&
      JSON.stringify(prevProps.dataSource) === JSON.stringify(nextProps.dataSource) &&
      JSON.stringify(prevProps.images) === JSON.stringify(nextProps.images)
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 20,
    color: COLORS.text.main,
  },
});
