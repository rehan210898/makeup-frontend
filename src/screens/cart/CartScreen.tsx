import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useCartStore } from '../../store/cartStore';
import { RootStackParamList } from '../../navigation/types';
import { Image } from 'expo-image';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

const formatCurrency = (price: string | number | undefined | null) => {
  if (price === undefined || price === null) return '₹ 0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '₹ 0.00';
  return `₹ ${numPrice.toFixed(2)}`;
};

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCartStore();

  const totalRegular = items.reduce((sum, item) => {
      const regPrice = item.variation?.regular_price || item.product.regularPrice || item.product.price;
      const val = regPrice ? parseFloat(regPrice.toString()) : 0;
      return sum + (val * item.quantity);
  }, 0);

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const regularPrice = item.variation?.regular_price || item.product.regularPrice;
    const price = item.variation?.price || item.product.price;
    const isOnSale = regularPrice && parseFloat(regularPrice) > parseFloat(price);

    return (
    <TouchableOpacity 
      style={styles.cartItem}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.product.images?.[0]?.src }}
          style={styles.itemImage}
          contentFit="cover"
        />
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
          <TouchableOpacity 
            style={styles.removeBtn}
            onPress={() => removeItem(item.product_id, item.variation_id)}
          >
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {item.selectedAttributes && (
          <Text style={styles.itemVariant}>
            {Object.values(item.selectedAttributes).join(' • ')}
          </Text>
        )}
        
        {item.isStitched && (
            <View style={styles.stitchedBadge}>
                <Text style={styles.stitchedText}>+ Stitched (+₹ 35)</Text>
            </View>
        )}
        
        <View style={styles.itemFooter}>
          <View>
              {isOnSale && (
                  <Text style={styles.itemRegularPrice}>{formatCurrency(regularPrice)}</Text>
              )}
              <Text style={styles.itemPrice}>{formatCurrency(price)}</Text>
          </View>
          
          <View style={styles.qtyContainer}>
            <TouchableOpacity 
              style={styles.qtyBtn}
              onPress={(e) => {
                e.stopPropagation();
                updateQuantity(item.product_id, item.quantity - 1, item.variation_id);
              }}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity 
              style={[
                styles.qtyBtn,
                item.quantity >= (item.variation?.maxQuantity ?? item.product.maxQuantity ?? 99) && styles.disabledQtyBtn
              ]}
              onPress={(e) => {
                e.stopPropagation();
                const maxQty = item.variation?.maxQuantity ?? item.product.maxQuantity ?? 99;
                if (item.quantity < maxQty) {
                  updateQuantity(item.product_id, item.quantity + 1, item.variation_id);
                }
              }}
              disabled={item.quantity >= (item.variation?.maxQuantity ?? item.product.maxQuantity ?? 99)}
            >
              <Text style={[
                styles.qtyBtnText,
                item.quantity >= (item.variation?.maxQuantity ?? item.product.maxQuantity ?? 99) && styles.disabledQtyBtnText
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount} items</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity 
            style={styles.shopBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView 
            contentContainerStyle={styles.listContent} 
            showsVerticalScrollIndicator={false}
          >
             {items.map(item => (
                 <View key={`${item.product_id}-${item.variation_id || 'simple'}`}>
                     {renderCartItem({ item })}
                 </View>
             ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <View style={{ alignItems: 'flex-end' }}>
                 {totalRegular > subtotal && (
                     <Text style={styles.summaryOriginal}>{formatCurrency(totalRegular)}</Text>
                 )}
                 <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <View style={{ alignItems: 'flex-end' }}>
                 {totalRegular > subtotal && (
                     <Text style={styles.totalOriginal}>{formatCurrency(totalRegular)}</Text>
                 )}
                 <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Checkout</Text>
              <Text style={styles.checkoutBtnPrice}>{formatCurrency(subtotal)}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  badge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearBtn: {
    marginLeft: 'auto',
  },
  clearText: {
    color: COLORS.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 320, // Increased padding
  },
  cartItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Glass-like opacity
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
  itemImage: {
    width: 70, // Compact
    height: 90, // Compact
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
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
  itemName: {
    fontSize: 14,
    fontWeight: '600',
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
  itemVariant: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  stitchedBadge: {
    backgroundColor: COLORS.primarySoft,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  stitchedText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemRegularPrice: {
      fontSize: 12,
      color: COLORS.text.muted,
      textDecorationLine: 'line-through',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // Slightly darker for glass contrast
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  disabledQtyBtn: {
    backgroundColor: '#E0E0E0',
    elevation: 0,
  },
  disabledQtyBtnText: {
    color: '#999',
  },
  qtyText: {
    paddingHorizontal: 10,
    fontWeight: '600',
    fontSize: 13,
    color: COLORS.text.main,
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70, // Moved up above Tab Bar (85/65) + 5
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
  summaryOriginal: {
      fontSize: 12,
      color: COLORS.text.muted,
      textDecorationLine: 'line-through',
      marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.main,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.main,
  },
  totalOriginal: {
      fontSize: 14,
      color: COLORS.text.muted,
      textDecorationLine: 'line-through',
      marginBottom: 2,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  checkoutBtnPrice: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shopBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
