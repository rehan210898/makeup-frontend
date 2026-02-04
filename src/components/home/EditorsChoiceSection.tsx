import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import productService from '../../services/productService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';
import { useWishlistStore } from '../../store/wishlistStore';

interface EditorsChoiceSectionProps {
  title?: string;
  productIds?: number[];
}

export const EditorsChoiceSection: React.FC<EditorsChoiceSectionProps> = ({
  title = "Editor's Choice",
  productIds,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { items: wishlistItems, addItem, removeItem } = useWishlistStore();

  useEffect(() => {
    loadProducts();
  }, [productIds]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let data: Product[];

      if (productIds && productIds.length > 0) {
        data = await productService.getProductsByIds(productIds);
      } else {
        const response = await productService.getProducts({
          featured: true,
          per_page: 6,
        });
        data = response.data;
      }

      setProducts(data);
    } catch (error) {
      console.error('Error loading editor\'s choice products:', error);
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

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    const isWishlisted = wishlistItems.some(w => w.id === item.id);
    
    return (
      <View style={{ width: 260 }}>
        <ProductCard
          item={item}
          onPress={handleProductPress}
          onWishlistPress={toggleWishlist}
          isWishlisted={isWishlisted}
          variant="default" // Using default to match requested layout
          index={index}
        />
      </View>
    );
  }, [handleProductPress, toggleWishlist, wishlistItems]);

  if (products.length === 0 && !loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Editor's</Text>
          <Text style={styles.sectionTitleAccent}> Choice</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ProductList', {
              type: 'featured',
              title: "Editor's Choice",
            })
          }
        >
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 22,
    color: COLORS.text.main,
  },
  sectionTitleAccent: {
    fontFamily: FONTS.serif.semiBoldItalic,
    fontSize: 22,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  viewAll: {
    fontFamily: FONTS.display.medium,
    fontSize: 14,
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default EditorsChoiceSection;