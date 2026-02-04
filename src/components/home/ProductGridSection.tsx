import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
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
}

const { width } = Dimensions.get('window');
const PADDING = 15;
const GAP = 10;
const COLUMNS = 3;
const ITEM_WIDTH = Math.floor((width - (PADDING * 2) - (GAP * 2)) / COLUMNS);

const ProductGridSectionComponent: React.FC<ProductGridSectionProps> = ({ title, dataSource, withContainer }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { items: wishlistItems, addItem, removeItem } = useWishlistStore();

  useEffect(() => {
    loadProducts();
  }, [dataSource]);

  const loadProducts = async () => {
    if (!dataSource || !dataSource.ids) {
      setLoading(false);
      return;
    }

    try {
      const response = await productService.getProducts({
        // @ts-ignore
        include: dataSource.ids
      });

      if (response && response.data) {
        const ids = dataSource.ids;
        const sorted = response.data.sort((a: any, b: any) => ids.indexOf(a.id) - ids.indexOf(b.id));
        setProducts(sorted);
      }
    } catch (error) {
      console.error('Error loading grid products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = useCallback((id: number) => {
    navigation.navigate('ProductDetail', { productId: id });
  }, [navigation]);

  const toggleWishlist = useCallback((id: number) => {
    const isWishlisted = wishlistItems.some(item => item.id === id);
    if (isWishlisted) {
      removeItem(id);
    } else {
      const product = products.find(p => p.id === id);
      if (product) addItem(product);
    }
  }, [wishlistItems, products, addItem, removeItem]);

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View style={{ width: ITEM_WIDTH, marginBottom: GAP }}>
      <ProductCard
        item={item}
        onPress={handleProductPress}
        onWishlistPress={toggleWishlist}
        isWishlisted={wishlistItems.some(w => w.id === item.id)}
        variant="compact"
        index={index}
      />
    </View>
  ), [handleProductPress, toggleWishlist, wishlistItems]);

  const renderSkeletonItem = useCallback(() => (
    <View style={{ width: ITEM_WIDTH, marginBottom: GAP }}>
      <ProductCardSkeleton />
    </View>
  ), []);

  if (loading) {
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
            numColumns={COLUMNS}
            renderItem={renderSkeletonItem}
            keyExtractor={(item) => item.toString()}
          />
        </View>
      </View>
    );
  }

  if (!products.length) return null;

  const gridHeight = Math.ceil(products.length / COLUMNS) * (ITEM_WIDTH * 1.6 + GAP);

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
          numColumns={COLUMNS}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

// Memoize to prevent unnecessary re-renders
export const ProductGridSection = memo(ProductGridSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.withContainer === nextProps.withContainer &&
    JSON.stringify(prevProps.dataSource) === JSON.stringify(nextProps.dataSource)
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
