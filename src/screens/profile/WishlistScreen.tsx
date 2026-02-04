import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';
import CartIcon from '../../components/icons/CartIcon';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const navigation = useNavigation();
  const { items, removeItem } = useWishlistStore();
  const { addItem: addToCart, itemCount } = useCartStore();

  // Safety filter to remove corrupt items (e.g. from previous bugs)
  const validItems = items.filter(item => item && typeof item.id === 'number');

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
        source={{ uri: item.images?.[0]?.src }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <View style={styles.rowBetween}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <TouchableOpacity 
                style={styles.removeBtn}
                onPress={() => removeItem(item.id)}
            >
                <Feather name="x" size={18} color={COLORS.text.muted} />
            </TouchableOpacity>
        </View>
        
        <Text style={styles.price}>₹ {item.price}</Text>
        
        <TouchableOpacity 
            style={styles.moveToCartBtn}
            onPress={() => handleAddToCart(item)}
        >
            <Text style={styles.moveToCartText}>Move to Bag</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeftIcon color={COLORS.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist ({validItems.length})</Text>
        <TouchableOpacity onPress={handleGoToCart} style={styles.headerCartBtn}>
          <CartIcon size={24} color={COLORS.primary} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {validItems.length === 0 ? (
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
    backgroundColor: COLORS.white,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: COLORS.white,
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
    marginBottom: 16,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  image: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.display.medium,
    color: COLORS.text.main,
    marginBottom: 4,
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  price: {
    fontSize: 16,
    fontFamily: FONTS.display.bold,
    color: COLORS.primary,
  },
  removeBtn: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  moveToCartBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  moveToCartText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONTS.display.bold,
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