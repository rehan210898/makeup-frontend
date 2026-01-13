import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { useCartStore } from '../../store/cartStore';
import { RootStackParamList } from '../../navigation/types';
import { Image } from 'expo-image';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCartStore();

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₹ ${numPrice.toFixed(2)}`;
  };
  
  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.cartItem}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.product.images?.[0]?.src }}
        style={styles.itemImage}
        contentFit="cover"
      />
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.product_id, item.variation_id)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {item.selectedAttributes && (
          <Text style={styles.itemVariant}>
            {Object.values(item.selectedAttributes).join(', ')}
          </Text>
        )}
        {item.isStitched && (
            <Text style={[styles.itemVariant, { color: COLORS.primary, fontWeight: '600', marginTop: 4 }]}>
                + Stitched (+₹ 35)
            </Text>
        )}
        
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
          
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
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
             {items.map(item => (
                 <View key={`${item.product_id}-${item.variation_id || 'simple'}`}>
                     {renderCartItem({ item })}
                 </View>
             ))}
             
             {/* Space for footer */}
             <View style={{height: 100}} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
            </View>
            
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Checkout</Text>
              <Text style={styles.checkoutBtnPrice}>{formatPrice(subtotal)}</Text>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  },
  badge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  clearBtn: {
    marginLeft: 'auto',
  },
  clearText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 250,
  },
  cartItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 65,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
    marginRight: 10,
  },
  removeText: {
    fontSize: 18,
    color: '#CCC',
    padding: 5,
  },
  itemVariant: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  disabledQtyBtn: {
    backgroundColor: '#EEEEEE',
  },
  disabledQtyBtnText: {
    color: '#AAAAAA',
  },
  qtyText: {
    paddingHorizontal: 12,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutBtnPrice: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  shopBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
