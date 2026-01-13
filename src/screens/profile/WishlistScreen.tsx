import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';
import CartIcon from '../../components/icons/CartIcon';
import CartPlusIcon from '../../components/icons/CartPlusIcon';
import TrashIcon from '../../components/icons/TrashIcon';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const navigation = useNavigation();
  const { items, removeItem } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

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

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.images[0]?.src }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>₹ {item.price}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cartBtn}
            onPress={() => handleAddToCart(item)}
          >
            <CartPlusIcon size={20} color={COLORS.cream} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.removeBtn}
            onPress={() => removeItem(item.id)}
          >
            <TrashIcon size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist ({items.length})</Text>
        <TouchableOpacity onPress={handleGoToCart} style={styles.headerCartBtn}>
          <CartIcon size={24} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your wishlist is empty 💔</Text>
          <TouchableOpacity 
            style={[styles.shopBtn, { backgroundColor: COLORS.accent }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 60,
  },
  backBtnText: {
    color: COLORS.cream,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.cream,
  },
  headerCartBtn: {
    width: 60,
    alignItems: 'flex-end',
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  info: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cartBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cartBtnText: {
    color: COLORS.cream,
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  removeBtnText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.gray[600],
    marginBottom: 20,
  },
  shopBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});