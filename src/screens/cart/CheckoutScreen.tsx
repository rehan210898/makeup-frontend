import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';
import axios from 'axios';
import { API_CONFIG } from '../../constants';
import { AddressAutofill } from '../../components/common/AddressAutofill';
import { SavedAddress } from '../../types';
import { useRazorpayPayment } from '../../hooks/useRazorpayPayment';
import { useCartServer } from '../../hooks/useCartServer';
import { AddressSchema } from '../../services/CartService';
import { InfoIcon } from '../../components/icons/InfoIcon';

// Custom Hooks for Logic Extraction
import { useCheckoutCalculations } from '../../hooks/useCheckoutCalculations';
import { useAddressAutoUpdate } from '../../hooks/useAddressAutoUpdate';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { items, subtotal: localSubtotal, clearCart } = useCartStore();
  const { user, token } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('card');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showShippingInfo, setShowShippingInfo] = useState(false);
  const { startCheckout, isProcessing } = useRazorpayPayment();
  
  const handleShowInfo = () => {
      setShowShippingInfo(true);
      setTimeout(() => {
          setShowShippingInfo(false);
      }, 3000);
  };
  
  // Calculate server payment method based on local state
  const serverPaymentMethod = paymentMethod === 'card' ? 'razorpay' : 'cod';

  // Use new Cart Server Hook
  const { 
    cart: serverCart, 
    shippingRates, 
    isLoading: isServerLoading,
    updateAddress, 
    isUpdatingAddress, // Added this back
    refetchCart,
    applyCoupon,
    removeCoupon,
    isApplyingCoupon,
    availableCoupons,
    isCouponsLoading
  } = useCartServer(items, serverPaymentMethod);

  // Extract Calculation Logic
  const {
      getCurrency,
      getShippingCost,
      getTotal,
      couponFees, // Negative fees for discounts
      getCodFeeAmount
  } = useCheckoutCalculations(serverCart, localSubtotal, shippingRates, paymentMethod);

  const [couponCode, setCouponCode] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);

  const handleApplyCoupon = () => {
      if (!couponCode.trim()) return;
      applyCoupon(couponCode, {
          onSuccess: () => setCouponCode('')
      });
  };

  const handleRemoveCoupon = (code: string) => {
      removeCoupon(code);
  };

  const handleSelectCoupon = (code: string) => {
      setCouponCode(code);
      setShowCouponModal(false);
  };

  const renderCouponItem = ({ item }: { item: any }) => (
      <TouchableOpacity 
        style={styles.couponItem}
        onPress={() => handleSelectCoupon(item.code)}
      >
          <View style={styles.couponHeader}>
              <Text style={styles.couponCodeText}>{item.code}</Text>
              {item.amount && <Text style={styles.couponAmount}>
                  {item.discount_type === 'percent' ? `${item.amount}% OFF` : `₹${item.amount} OFF`}
              </Text>}
          </View>
          {item.description ? <Text style={styles.couponDesc}>{item.description}</Text> : null}
      </TouchableOpacity>
  );

  const handlePaymentMethodChange = (method: 'cod' | 'card') => {
      setPaymentMethod(method);
  };

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.billing?.phone || '',
    address: user?.billing?.address_1 || '',
    city: user?.billing?.city || '',
    state: user?.billing?.state || '',
    postcode: user?.billing?.postcode || '',
    country: user?.billing?.country || 'IN'
  });

  // Update form if user data loads
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.billing?.phone || '',
        address: prev.address || user.billing?.address_1 || '',
        city: prev.city || user.billing?.city || '',
        state: prev.state || user.billing?.state || '',
        postcode: prev.postcode || user.billing?.postcode || '',
        country: prev.country || user.billing?.country || 'IN'
      }));
    }
  }, [user]);

  // Use Extracted Address Logic
  useAddressAutoUpdate({ form, updateAddress });

  const handleSelectAddress = (address: SavedAddress) => {
    const newForm = {
      firstName: address.first_name,
      lastName: address.last_name,
      email: address.email,
      phone: address.phone,
      address: address.address_1,
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      country: address.country
    };
    setForm(newForm);
    setShowAddressModal(false);
    
    // Trigger update immediately
    const payload = {
        first_name: newForm.firstName,
        last_name: newForm.lastName,
        address_1: newForm.address,
        city: newForm.city,
        state: newForm.state,
        postcode: newForm.postcode,
        country: newForm.country,
        email: newForm.email,
        phone: newForm.phone
    };
    updateAddress(payload);
  };

  const handlePlaceOrder = async () => {
    const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        address_1: form.address,
        city: form.city,
        state: form.state,
        postcode: form.postcode,
        country: form.country,
        email: form.email,
        phone: form.phone
    };

    const validation = AddressSchema.safeParse(payload);
    if (!validation.success) {
        const errorMsg = validation.error.issues.map(e => e.message).join('\n');
        Alert.alert('Invalid Address', errorMsg);
        return;
    }

    if (serverCart?.needs_shipping && shippingRates.length === 0 && !isServerLoading) {
        Alert.alert('No Shipping', 'No shipping methods available for your address.');
        return;
    }

    const selectedRate = shippingRates.find(r => r.selected);
    if (serverCart?.needs_shipping && !selectedRate) {
        Alert.alert('Select Shipping', 'Please select a shipping method.');
        return;
    }
    
    // Razorpay Flow
    if (paymentMethod === 'card') {
        const checkoutItems = items.map(item => ({
            product_id: item.product_id,
            variation_id: item.variation_id,
            quantity: item.quantity
        }));

        startCheckout({
            address: payload,
            items: checkoutItems,
            shipping_lines: selectedRate ? [{
                method_id: selectedRate.method_id,
                method_title: selectedRate.name,
                total: (parseInt(selectedRate.price) / 100).toString()
            }] : [],
            fee_lines: couponFees
        }, {
            onSuccess: (data: any) => {
                clearCart();
                Alert.alert(
                    'Success', 
                    `Order #${data.orderId} placed successfully!`, 
                    [
                        { text: 'Track Order', onPress: () => navigation.navigate('OrderTracking', { orderId: data.orderId, fromCheckout: true }) },
                        { text: 'OK', onPress: () => navigation.navigate('Home' as any) }
                    ]
                );
            }
        });
        return;
    }

    // COD Flow
    setLoading(true);
    try {
      const feeLines = [];
      const codFeeAmount = getCodFeeAmount();

      if (codFeeAmount > 0) {
          feeLines.push({
              name: 'Cash on Delivery Fee',
              total: (codFeeAmount / 100).toFixed(2),
              tax_status: 'none',
              tax_class: ''
          });
      }
      
      feeLines.push(...couponFees);

      const orderData: any = {
        payment_method: 'cod',
        payment_method_title: 'Cash on Delivery',
        set_paid: false,
        status: 'processing',
        billing: payload,
        shipping: payload,
        line_items: items.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id,
          quantity: item.quantity
        })),
        shipping_lines: selectedRate ? [{
            method_id: selectedRate.method_id,
            method_title: selectedRate.name,
            total: (parseInt(selectedRate.price) / 100).toString()
        }] : [],
        fee_lines: feeLines
      };

      if (user?.id) {
        orderData.customer_id = user.id;
      }

      const response = await axios.post(`${API_CONFIG.BASE_URL}/orders`, orderData, {
        headers: { 
            'X-API-Key': API_CONFIG.API_KEY,
            'Authorization': token ? `Bearer ${token}` : undefined
        }
      });

      if (response.data.success) {
        clearCart();
        Alert.alert(
            'Success', 
            `Order #${response.data.data.id} placed successfully!`, 
            [
                { text: 'Track Order', onPress: () => navigation.navigate('OrderTracking', { orderId: response.data.data.id, fromCheckout: true }) },
                { text: 'OK', onPress: () => navigation.navigate('Home' as any) }
            ]
        );
      }
    } catch (error: any) {
      console.error('Order error:', error.response?.data || error.message);
      Alert.alert('Order Failed', 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
            <RefreshControl refreshing={isServerLoading} onRefresh={refetchCart} />
        }
      >
        <View style={styles.section}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
             <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Billing & Shipping</Text>
             {user?.savedAddresses && user.savedAddresses.length > 0 && (
                 <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                     <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>Select Saved Address</Text>
                 </TouchableOpacity>
             )}
          </View>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name *"
              value={form.firstName}
              onChangeText={(text) => setForm({ ...form, firstName: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name"
              value={form.lastName}
              onChangeText={(text) => setForm({ ...form, lastName: text })}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email *"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone *"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
          />

          <AddressAutofill 
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            onSelect={(details) => setForm({
                ...form,
                address: details.address_1,
                city: details.city,
                state: details.state,
                country: details.country || 'IN'
            })}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City *"
              value={form.city}
              onChangeText={(text) => setForm({ ...form, city: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State/Emirate"
              value={form.state}
              onChangeText={(text) => setForm({ ...form, state: text })}
            />
          </View>
          
           <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Postcode"
              value={form.postcode}
              onChangeText={(text) => setForm({ ...form, postcode: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Country"
              value={form.country}
              editable={true} 
              onChangeText={(text) => setForm({ ...form, country: text })}
            />
          </View>
          
          {isUpdatingAddress && <Text style={{fontSize: 12, color: 'gray', marginTop: 5}}>Updating shipping rates...</Text>}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                 <Text style={[styles.sectionTitle, {marginBottom: 0}]}>Coupon Code</Text>
                 <TouchableOpacity onPress={() => setShowCouponModal(true)}>
                     <Text style={{color: COLORS.primary, fontWeight: 'bold', fontSize: 12}}>View Available</Text>
                 </TouchableOpacity>
             </View>
             
             <View style={styles.couponInputContainer}>
                 <TextInput 
                    style={styles.couponInput}
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                 />
                 <TouchableOpacity 
                    style={[styles.applyBtn, (!couponCode.trim() || isApplyingCoupon) && styles.disabledBtn]}
                    onPress={handleApplyCoupon}
                    disabled={!couponCode.trim() || isApplyingCoupon}
                 >
                     {isApplyingCoupon ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.applyBtnText}>Apply</Text>}
                 </TouchableOpacity>
             </View>
             
             {/* Applied Coupons */}
             {serverCart?.coupons && serverCart.coupons.length > 0 && (
                 <View style={styles.appliedCoupons}>
                     {serverCart.coupons.map((coupon) => (
                         <View key={coupon.code} style={styles.couponChip}>
                             <Text style={styles.couponCode}>{coupon.code}</Text>
                             <Text style={styles.couponDiscount}>
                                 - {getCurrency()} {(parseInt(coupon.totals.total_discount) / 100).toFixed(2)}
                             </Text>
                             <TouchableOpacity onPress={() => handleRemoveCoupon(coupon.code)}>
                                 <Text style={styles.removeCouponText}>✕</Text>
                             </TouchableOpacity>
                         </View>
                     ))}
                 </View>
             )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => handlePaymentMethodChange('cod')}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentTextContainer}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                    {paymentMethod === 'cod' && getCodFeeAmount() === 0 && (
                        <Text style={{color: COLORS.success, fontWeight: 'bold', fontSize: 12}}>Free COD</Text>
                    )}
                </View>
                <Text style={styles.paymentDesc}>Pay when you receive the order</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
            onPress={() => handlePaymentMethodChange('card')}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentTitle}>Credit / Debit Card</Text>
                <Text style={styles.paymentDesc}>Secure payment via Razorpay</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryValue}>
                {getCurrency()} {serverCart?.totals ? (parseInt(serverCart.totals.total_items) / 100).toFixed(2) : localSubtotal.toFixed(2)}
            </Text>
          </View>
          
          {serverCart && serverCart.totals && parseInt(serverCart.totals.total_discount) > 0 && (
             <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Discount</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                    - {getCurrency()} {(parseInt(serverCart.totals.total_discount) / 100).toFixed(2)}
                </Text>
             </View>
          )}

          <View style={styles.summaryRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.summaryText}>Shipping</Text>
                <TouchableOpacity onPress={handleShowInfo} style={{marginLeft: 5}}>
                    <InfoIcon size={14} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
            <Text style={styles.summaryValue}>{getShippingCost()}</Text>
          </View>

          {/* Fee Row */}
          {paymentMethod === 'cod' && (
              getCodFeeAmount() === 0 ? (
                  <View style={styles.summaryRow}>
                      <Text style={styles.summaryText}>COD Fee</Text>
                      <Text style={[styles.summaryValue, { color: COLORS.success }]}>Free</Text>
                  </View>
              ) : (
                  <View style={styles.summaryRow}>
                      <Text style={styles.summaryText}>COD Fee</Text>
                      <Text style={styles.summaryValue}>
                          {getCurrency()} {(getCodFeeAmount() / 100).toFixed(2)}
                      </Text>
                  </View>
              )
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalValue}>{getCurrency()} {getTotal()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderBtn, (loading || isProcessing || isServerLoading) && {opacity: 0.7}]}
          onPress={handlePlaceOrder}
          disabled={loading || isProcessing || isServerLoading}
        >
          {loading || isProcessing || isServerLoading ? (
            <ActivityIndicator color={COLORS.cream} />
          ) : (
            <Text style={styles.placeOrderText}>
                {paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ${getCurrency()} ${getTotal()}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Shipping Info Modal */}
      <Modal
        transparent
        visible={showShippingInfo}
        animationType="fade"
      >
          <View style={styles.infoModalOverlay}>
              <View style={styles.infoModalContent}>
                  <Text style={styles.infoModalEmoji}>✨ 🚀</Text>
                  <Text style={styles.infoModalTitle}>Free Shipping & COD!</Text>
                  <Text style={styles.infoModalText}>
                      Enjoy Free Shipping and Cash on Delivery on all orders above <Text style={{fontWeight: 'bold', color: COLORS.primary}}>₹500</Text>!
                  </Text>
              </View>
          </View>
      </Modal>

      <Modal visible={showAddressModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Address</Text>
                  <FlatList 
                    data={user?.savedAddresses || []}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.addressItem} onPress={() => handleSelectAddress(item)}>
                            <Text style={styles.addressLabel}>{item.label}</Text>
                            <Text>{item.address_1}, {item.city}</Text>
                        </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAddressModal(false)}>
                      <Text style={styles.closeBtnText}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* Coupon Modal */}
      <Modal 
        visible={showCouponModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCouponModal(false)}
      >
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Available Coupons</Text>
                      <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                          <Text style={styles.closeModalText}>✕</Text>
                      </TouchableOpacity>
                  </View>
                  
                  {isCouponsLoading ? (
                      <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 20}} />
                  ) : (
                      <FlatList 
                         data={availableCoupons}
                         keyExtractor={(item) => item.id.toString()}
                         renderItem={renderCouponItem}
                         ListEmptyComponent={<Text style={styles.emptyListText}>No coupons available.</Text>}
                         contentContainerStyle={{paddingBottom: 20}}
                      />
                  )}
              </View>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  couponInputContainer: {
      flexDirection: 'row',
      gap: 10,
  },
  couponInput: {
      flex: 1,
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
  },
  applyBtn: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 20,
      justifyContent: 'center',
      borderRadius: 8,
  },
  disabledBtn: {
      backgroundColor: '#ccc',
  },
  applyBtnText: {
      color: '#fff',
      fontWeight: 'bold',
  },
  appliedCoupons: {
      marginTop: 15,
  },
  couponChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#e8f5e9',
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#c8e6c9',
      justifyContent: 'space-between'
  },
  couponCode: {
      fontWeight: 'bold',
      color: '#2e7d32',
      textTransform: 'uppercase'
  },
  couponDiscount: {
      color: '#2e7d32',
      fontWeight: '600',
      marginHorizontal: 10
  },
  removeCouponText: {
      color: '#d32f2f',
      fontWeight: 'bold',
      padding: 5
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 15,
  },
  closeModalText: {
      fontSize: 24,
      color: '#999',
      fontWeight: 'bold',
  },
  couponItem: {
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#eee',
      marginBottom: 10,
      backgroundColor: '#f9f9f9',
  },
  couponHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
  },
  couponCodeText: {
      fontWeight: 'bold',
      fontSize: 16,
      color: COLORS.primary,
      textTransform: 'uppercase',
  },
  couponAmount: {
      color: COLORS.success,
      fontWeight: 'bold',
  },
  couponDesc: {
      color: '#666',
      fontSize: 13,
      marginBottom: 5,
  },
  emptyListText: {
      textAlign: 'center',
      color: '#999',
      marginTop: 20,
  },
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
    backgroundColor: COLORS.primary,
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#fdf0f0',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paymentDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryText: {
    color: '#666',
    fontSize: 14,
  },
  summaryValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  placeOrderText: {
    color: COLORS.cream,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
      width: '80%',
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 20,
      maxHeight: '60%',
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      color: COLORS.primary,
  },
  addressItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  addressLabel: {
      fontWeight: 'bold',
      marginBottom: 5,
  },
  closeBtn: {
      marginTop: 15,
      alignItems: 'center',
      padding: 10,
  },
  closeBtnText: {
      color: COLORS.primary,
      fontWeight: 'bold',
  },
  infoModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
  },
  infoModalContent: {
      backgroundColor: '#fff',
      padding: 25,
      borderRadius: 20,
      width: '80%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
  },
  infoModalEmoji: {
      fontSize: 40,
      marginBottom: 10,
  },
  infoModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 10,
      textAlign: 'center',
  },
  infoModalText: {
      fontSize: 16,
      color: '#555',
      textAlign: 'center',
      lineHeight: 22,
  }
});