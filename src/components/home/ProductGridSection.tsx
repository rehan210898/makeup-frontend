import React, { useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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
}

const { width } = Dimensions.get('window');
const PADDING = 15;
const GAP = 10;

const ProductGridSectionComponent: React.FC<ProductGridSectionProps> = ({ title, dataSource, withContainer, columns = 3, images }) => {
  const navigation = useNavigation<any>();
  const { itemIds: wishlistItemIds, addItem, removeItem } = useWishlistStore();

  const itemWidth = Math.floor((width - (PADDING * 2) - (GAP * (columns - 1))) / columns);

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

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View style={{ width: itemWidth, marginBottom: GAP, marginRight: (index + 1) % columns === 0 ? 0 : GAP }}>
      <ProductCard
        item={item}
        onPress={handleProductPress}
        onWishlistPress={toggleWishlist}
        isWishlisted={wishlistItemIds.includes(item.id)}
        variant="image_only"
        hidePrice={true}
        index={index}
      />
    </View>
  ), [handleProductPress, toggleWishlist, wishlistItemIds, itemWidth, columns]);

  const renderSkeletonItem = useCallback(() => (
    <View style={{ width: itemWidth, marginBottom: GAP, marginRight: GAP }}>
      <ProductCardSkeleton variant="image_only" />
    </View>
  ), [itemWidth]);

  if (isLoading) {
    return (
      <View style={[styles.container, withContainer && styles.withContainer]}>
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
        <View style={{ height: 200 }}>
          <FlashList
            data={[1, 2, 3]}
            numColumns={columns}
            renderItem={renderSkeletonItem}
            keyExtractor={(item) => item.toString()}
            estimatedItemSize={itemWidth}
          />
        </View>
      </View>
    );
  }

  if (!products.length) return null;

  const gridHeight = Math.ceil(products.length / columns) * (itemWidth + GAP);

  return (
    <View style={[styles.container, withContainer && styles.withContainer]}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <View style={{ height: gridHeight, minHeight: 200 }}>
        <FlashList
          data={products}
          numColumns={columns}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          estimatedItemSize={itemWidth}
        />
      </View>
    </View>
  );
};

export const ProductGridSection = memo(ProductGridSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.withContainer === nextProps.withContainer &&
    prevProps.columns === nextProps.columns &&
    JSON.stringify(prevProps.dataSource) === JSON.stringify(nextProps.dataSource) &&
    JSON.stringify(prevProps.images) === JSON.stringify(nextProps.images)
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: PADDING,
  },
  withContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
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
