import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';
import { ProductCardSkeleton } from '../skeletons/ProductCardSkeleton';

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
}

const { width } = Dimensions.get('window');
const GAP = 20;

const ProductSliderSectionComponent: React.FC<ProductSliderSectionProps> = ({ title, dataSource, images, layout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const isCompactSlider = layout === 'slider_2_5';
  const CARD_WIDTH = isCompactSlider ? (width / 2.5) : (width / 2) - 20;


  useEffect(() => {
    loadProducts();
  }, [dataSource, images]);

  const loadProducts = async () => {
    if (!dataSource) {
      setLoading(false);
      return;
    }

    try {
      let response: any;
      if (dataSource.type === 'ids' && dataSource.ids?.length) {
        response = await productService.getProducts({ 
          // @ts-ignore
          include: dataSource.ids 
        });

        // Apply Image Overrides and Sort by ID order
        if (response && response.data && images && images.length > 0) {
            const ids = dataSource.ids;
            
            // 1. Sort to match ID order
            const sorted = response.data.sort((a: any, b: any) => ids.indexOf(a.id) - ids.indexOf(b.id));
            
            // 2. Override images
            response.data = sorted.map((p: any) => {
                const originalIndex = ids.indexOf(p.id);
                if (originalIndex !== -1 && images[originalIndex]) {
                    return {
                        ...p,
                        images: [{ src: images[originalIndex] }] // Override main image
                    };
                }
                return p;
            });
        }

      } else if (dataSource.type === 'filter') {
        const filters: any = { per_page: 6 }; // Fetch fewer for carousel
        if (dataSource.key === 'popularity') {
          filters.orderby = 'popularity';
        } else if (dataSource.key === 'date') {
          filters.orderby = 'date';
        } else if (dataSource.key === 'rating') {
          filters.orderby = 'rating';
        } else if (dataSource.key === 'featured') {
          filters.featured = true;
        } else if (dataSource.key === 'on_sale') {
          filters.on_sale = true;
        } else if (dataSource.key === 'category' && dataSource.value) {
           if (typeof dataSource.value === 'string' && isNaN(Number(dataSource.value))) {
             try {
               const catResponse = await categoryService.getCategoryBySlug(dataSource.value);
               if (catResponse.data && catResponse.data.length > 0) {
                 filters.category = catResponse.data[0].id;
               } else {
                 console.warn(`Category slug '${dataSource.value}' not found`);
                 setLoading(false);
                 return;
               }
             } catch (err) {
               console.error('Error resolving category slug', err);
               setLoading(false);
               return;
             }
           } else {
             filters.category = dataSource.value;
           }
        }
        response = await productService.getProducts(filters);
      }
      
      if (response && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading slider products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = useCallback((id: number) => {
    navigation.navigate('ProductDetail', { productId: id });
  }, [navigation]);

  const renderSkeletonItem = useCallback(() => (
    <View style={{ width: CARD_WIDTH, marginRight: GAP }}>
      <ProductCardSkeleton />
    </View>
  ), [CARD_WIDTH]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <View style={{ width: CARD_WIDTH, marginRight: GAP }}>
      <ProductCard
        item={item}
        onPress={handleProductPress}
        hidePrice={!!images && images.length > 0}
      />
    </View>
  ), [CARD_WIDTH, handleProductPress, images]);

  if (loading) {
    return (
      <View style={styles.container}>
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
        <View style={{ height: 280 }}>
          <FlashList
            horizontal
            data={[1, 2, 3]}
            keyExtractor={(item) => item.toString()}
            renderItem={renderSkeletonItem}
            contentContainerStyle={styles.listContent}
            showsHorizontalScrollIndicator={false}
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
      <View style={{ height: 280 }}>
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
        />
      </View>
    </View>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
export const ProductSliderSection = memo(ProductSliderSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.layout === nextProps.layout &&
    JSON.stringify(prevProps.dataSource) === JSON.stringify(nextProps.dataSource) &&
    JSON.stringify(prevProps.images) === JSON.stringify(nextProps.images)
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 10, // Add some bottom padding for shadows
  },
  loading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
