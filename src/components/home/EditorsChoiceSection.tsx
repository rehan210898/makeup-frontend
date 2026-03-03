import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import productService from '../../services/productService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';
import { useWishlistStore } from '../../store/wishlistStore';
import { ProductCardSkeleton } from '../skeletons/ProductCardSkeleton';
import { Skeleton } from '../common/Skeleton';

interface EditorsChoiceSectionProps {
  title?: string;
  productIds?: number[];
}

export const EditorsChoiceSection: React.FC<EditorsChoiceSectionProps> = ({
  title = "Editor's Choice",
  productIds,
}) => {
  const navigation = useNavigation<any>();
  const { itemIds: wishlistItemIds, addItem, removeItem } = useWishlistStore();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'editors-choice', productIds?.join(',') || 'default'],
    queryFn: async () => {
      if (productIds && productIds.length > 0) {
        const response = await productService.getProducts({
          // @ts-ignore
          include: productIds,
        });
        return response.data || [];
      }
      const response = await productService.getProducts({
        featured: true,
        per_page: 6,
      });
      return response.data || [];
    },
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

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    const isWishlisted = wishlistItemIds.includes(item.id);
    return (
      <View style={{ width: 260 }}>
        <ProductCard
          item={item}
          onPress={handleProductPress}
          onWishlistPress={toggleWishlist}
          isWishlisted={isWishlisted}
          variant="default"
          index={index}
        />
      </View>
    );
  }, [handleProductPress, toggleWishlist, wishlistItemIds]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={150} height={24} borderRadius={4} />
          <Skeleton width={60} height={16} borderRadius={4} />
        </View>
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          renderItem={() => (
            <View style={{ width: 260 }}>
              <ProductCardSkeleton />
            </View>
          )}
        />
      </View>
    );
  }

  if (products.length === 0) return null;

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
