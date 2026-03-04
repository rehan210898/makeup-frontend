import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';
import api from '../../services/api';
import CartIcon from '../../components/icons/CartIcon';
import AddToBagIcon from '../../components/icons/AddToBagIcon';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import { Feather } from '@expo/vector-icons';
import { WishlistSkeleton } from '../../components/skeletons/WishlistSkeleton';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const navigation = useNavigation();
  const { itemIds, removeItem } = useWishlistStore();
  const { addItem: addToCart, itemCount } = useCartStore();

  // Step 12: Fetch product data for wishlist IDs via React Query
  const { data: wishlistProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['wishlist-products', itemIds],
    queryFn: async () => {
      if (itemIds.length === 0) return [];
      const response = await api.get<{ success: boolean; data: Product[] }>(
        `/products?include=${itemIds.join(',')}&per_page=${itemIds.length}`
      );
      return response.data;
    },
    enabled: itemIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const validItems = wishlistProducts.filter((item: Product) => item && typeof item.id === 'number');

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetail' as any, { productId });
  };

  const handleAddToCart = (product: Product) => {
    const success = addToCart(product, 1);
    if (success) {
      removeItem(product.id);
    }
  };

  const handleGoToCart = () => {
    navigation.navigate('MainTabs' as any, { screen: 'CartTab' });
  };

  const renderItem = ({ item }: { item: Product }) => {
    const regularPrice = item.regularPrice;
    const price = item.price;
    const isOnSale = regularPrice && parseFloat(regularPrice) > parseFloat(price);
    const discountPercent = isOnSale
      ? Math.round(((parseFloat(regularPrice) - parseFloat(price)) / parseFloat(regularPrice)) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleProductPress(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.images?.[0]?.src || item.image || item.thumbnail || undefined }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.itemHeader}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeItem(item.id)}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemFooter}>
            <View>
              {isOnSale && (
                <View style={styles.discountRow}>
                  <Text style={styles.regularPrice}>₹ {regularPrice}</Text>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              )}
              <Text style={styles.price}>₹ {price}</Text>
            </View>

            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={() => handleAddToCart(item)}
            >
              <AddToBagIcon size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeftIcon color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist ({itemIds.length})</Text>
        <TouchableOpacity onPress={handleGoToCart} style={styles.headerCartBtn}>
          <CartIcon size={24} color={COLORS.primary} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoadingProducts && itemIds.length > 0 ? (
        <WishlistSkeleton />
      ) : validItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="heart" size={60} color={COLORS.text.muted} style={{marginBottom: 20}} />
          <Text style={styles.emptyText}>Your wishlist is empty</Text>
          <TouchableOpacity 
            style={styles.shopBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={validItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.serif.bold,
    color: COLORS.text.main,
  },
  headerCartBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: FONTS.display.bold,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  image: {
    width: 70,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.display.medium,
    color: COLORS.text.main,
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  removeBtn: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  removeText: {
    fontSize: 14,
    color: '#CCC',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regularPrice: {
    fontSize: 12,
    color: COLORS.text.muted,
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    fontFamily: FONTS.display.bold,
    color: COLORS.primary,
  },
  addToCartBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text.muted,
    marginBottom: 20,
    fontFamily: FONTS.display.medium,
  },
  shopBtn: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shopBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.display.bold,
    fontSize: 16,
  },
});