import React, { useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import productService from '../../services/productService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';
import { ProductCardSkeleton } from '../skeletons/ProductCardSkeleton';
import { useWishlistStore } from '../../store/wishlistStore';

interface ProductGridSectionProps {
  title?: string;
  dataSource?: {
    type: 'ids' | 'filter';
    ids?: number[];
  };
  withContainer?: boolean;
  columns?: number;
  images?: string[];
  cardStyle?: 'default' | 'image_only';
  containerColor?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SECTION_PADDING = 20;
const CONTAINER_MARGIN = 15;
const CONTAINER_PADDING = 12;
const GAP = 12;

const ProductGridSectionComponent: React.FC<ProductGridSectionProps> = ({ title, dataSource, withContainer, columns = 3, images, cardStyle = 'image_only', containerColor }) => {
  const navigation = useNavigation<any>();
  const { itemIds: wishlistItemIds, addItem, removeItem } = useWishlistStore();

  // Calculate item width based on whether we're in a container or not
  const availableWidth = withContainer
    ? SCREEN_WIDTH - (CONTAINER_MARGIN * 2) - (CONTAINER_PADDING * 2)
    : SCREEN_WIDTH - (SECTION_PADDING * 2);
  const itemWidth = Math.floor((availableWidth - (GAP * (columns - 1))) / columns);

  const queryKey = useMemo(() =>
    ['products', 'grid', dataSource?.ids?.join(',') || 'none', images?.join(',') || 'none'],
    [dataSource, images]
  );

  const { data: products = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!dataSource?.ids) return [];

      const response = await productService.getProducts({
        // @ts-ignore
        include: dataSource.ids,
      });

      if (!response?.data) return [];

      const ids = dataSource.ids;
      let sorted = response.data.sort((a: any, b: any) => ids.indexOf(a.id) - ids.indexOf(b.id));

      if (images && images.length > 0) {
        sorted = sorted.map((p: any) => {
          const originalIndex = ids.indexOf(p.id);
          if (originalIndex !== -1 && images[originalIndex]) {
            return { ...p, images: [{ src: images[originalIndex] }] };
          }
          return p;
        });
      }

      return sorted;
    },
    enabled: !!dataSource?.ids?.length,
    staleTime: 1000 * 60 * 10,
  });

  const handleProductPress = useCallback((id: number) => {
    navigation.navigate('ProductDetail', { productId: id });
  }, [navigation]);

  const toggleWishlist = useCallback((id: number) => {
    const isWishlisted = wishlistItemIds.includes(id);
    if (isWishlisted) {
      removeItem(id);
    } else {
      const product = products.find(p => p.id === id);
      if (product) addItem(product);
    }
  }, [wishlistItemIds, products, addItem, removeItem]);

  const isImageOnly = cardStyle === 'image_only';

  // Render grid manually instead of FlashList to get proper gap control
  const renderGrid = () => {
    const rows: Product[][] = [];
    for (let i = 0; i < products.length; i += columns) {
      rows.push(products.slice(i, i + columns));
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={[styles.row, rowIndex < rows.length - 1 && { marginBottom: GAP }]}>
        {row.map((item, colIndex) => (
          <View key={item.id} style={[{ width: itemWidth }, colIndex < row.length - 1 && { marginRight: GAP }]}>
            <ProductCard
              item={item}
              onPress={handleProductPress}
              onWishlistPress={toggleWishlist}
              isWishlisted={wishlistItemIds.includes(item.id)}
              variant={cardStyle}
              hidePrice={isImageOnly}
              index={rowIndex * columns + colIndex}
            />
          </View>
        ))}
      </View>
    ));
  };

  const renderSkeletonGrid = () => {
    const skeletonCount = columns === 2 ? 4 : 6;
    const rows: number[][] = [];
    for (let i = 0; i < skeletonCount; i += columns) {
      rows.push(Array.from({ length: columns }, (_, j) => i + j));
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={[styles.row, rowIndex < rows.length - 1 && { marginBottom: GAP }]}>
        {row.map((_, colIndex) => (
          <View key={colIndex} style={[{ width: itemWidth }, colIndex < row.length - 1 && { marginRight: GAP }]}>
            <ProductCardSkeleton variant={isImageOnly ? 'image_only' : 'compact'} />
          </View>
        ))}
      </View>
    ));
  };

  if (isLoading) {
    return (
      <View style={[
        styles.container,
        withContainer && styles.withContainer,
        containerColor ? { backgroundColor: containerColor } : null
      ]}>
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
        {renderSkeletonGrid()}
      </View>
    );
  }

  if (!products.length) return null;

  return (
    <View style={[
      styles.container,
      withContainer && styles.withContainer,
      containerColor ? { backgroundColor: containerColor } : null
    ]}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {renderGrid()}
    </View>
  );
};

export const ProductGridSection = memo(ProductGridSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.withContainer === nextProps.withContainer &&
    prevProps.columns === nextProps.columns &&
    prevProps.cardStyle === nextProps.cardStyle &&
    prevProps.containerColor === nextProps.containerColor &&
    JSON.stringify(prevProps.dataSource) === JSON.stringify(nextProps.dataSource) &&
    JSON.stringify(prevProps.images) === JSON.stringify(nextProps.images)
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: SECTION_PADDING,
  },
  withContainer: {
    backgroundColor: '#F8F5F0',
    borderRadius: 16,
    paddingVertical: CONTAINER_PADDING,
    marginHorizontal: CONTAINER_MARGIN,
    paddingHorizontal: CONTAINER_PADDING,
  },
  row: {
    flexDirection: 'row',
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 18,
    color: COLORS.text.main,
  },
});
