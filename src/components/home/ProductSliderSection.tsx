import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';

interface ProductSliderSectionProps {
  title?: string;
  dataSource?: {
    type: 'filter' | 'ids';
    key?: string;
    ids?: number[];
    value?: string | number;
  };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 20;
const GAP = 20;

export const ProductSliderSection: React.FC<ProductSliderSectionProps> = ({ title, dataSource }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadProducts();
  }, [dataSource]);

  const loadProducts = async () => {
    if (!dataSource) {
      setLoading(false);
      return;
    }

    try {
      let response;
      if (dataSource.type === 'ids' && dataSource.ids?.length) {
        response = await productService.getProducts({ 
          // @ts-ignore
          include: dataSource.ids 
        });
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

  const handleProductPress = (id: number) => {
    navigation.navigate('ProductDetail', { productId: id });
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /></View>;
  if (!products.length) return null;

  return (
    <View style={styles.container}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard 
            item={item} 
            onPress={handleProductPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + GAP}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
};

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
