import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';

// Visual steps for the order progress tracker
const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: 'file-text' as const },
  { key: 'processing', label: 'Processing', icon: 'package' as const },
  { key: 'on-hold', label: 'On Hold', icon: 'clock' as const },
  { key: 'completed', label: 'Delivered', icon: 'check-circle' as const },
];

/**
 * Screen to track the status of a specific order.
 * Implements real-time polling to keep status updated.
 */
export default function OrderTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { orderId, fromCheckout } = route.params || {};
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Navigation Handlers ---

  const handleBack = () => {
      if (fromCheckout) {
          // If coming from checkout, go back to Cart (which will be empty) or Home
          // 'MainTabs' -> 'CartTab' ensures we land in a valid stack
          navigation.navigate('MainTabs', { screen: 'CartTab' });
      } else {
          navigation.goBack();
      }
  };

  // --- Effects ---

  // Poll for order updates every 10 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (orderId) {
      loadOrderDetails(false); // Initial load with spinner
      
      // Silent update loop
      intervalId = setInterval(() => {
        loadOrderDetails(true); 
      }, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId]);

  const loadOrderDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- Helpers ---

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return COLORS.success;
      case 'processing': return COLORS.info;
      case 'on-hold': return COLORS.warning;
      case 'pending': return COLORS.warning;
      case 'cancelled': return COLORS.error;
      case 'refunded': return COLORS.gray[500];
      case 'failed': return COLORS.error;
      case 'draft': 
      case 'auto-draft':
      case 'checkout-draft':
        return COLORS.gray[400];
      case 'cancel-request': return '#9333ea';
      default: return COLORS.warning;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pending Payment';
      case 'processing': return 'Processing';
      case 'on-hold': return 'On Hold';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      case 'failed': return 'Failed';
      case 'cancel-request': return 'Cancel Request';
      case 'draft': 
      case 'auto-draft':
      case 'checkout-draft':
        return 'Draft';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStepStatus = (currentStatus: string, stepKey: string) => {
    const statusMap: {[key: string]: number} = {
      'pending': 0,
      'processing': 1,
      'on-hold': 2,
      'cancel-request': 2, // Treat as on-hold/processing context
      'completed': 3,
      'cancelled': -1,
      'failed': -1,
      'refunded': -1,
      'draft': -1,
      'auto-draft': -1,
      'checkout-draft': -1
    };

    const currentIdx = statusMap[currentStatus] ?? 0;
    const stepIdx = statusMap[stepKey];

    if (currentIdx === -1) return 'cancelled';
    if (currentIdx >= stepIdx) return 'active';
    return 'inactive';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeftIcon color={COLORS.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Status Stepper */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(order.status) }]}>
                    {getStatusLabel(order.status)}
                </Text>
            </View>
          </View>
          <View style={styles.stepperContainer}>
            {ORDER_STEPS.map((step, index) => {
              const status = getStepStatus(order.status, step.key);
              const isActive = status === 'active';
              const isLast = index === ORDER_STEPS.length - 1;

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicatorContainer}>
                    <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                      <Feather name={step.icon} size={16} color={isActive ? COLORS.success : '#999'} />
                    </View>
                    {!isLast && <View style={[styles.stepLine, isActive && getStepStatus(order.status, ORDER_STEPS[index+1].key) === 'active' && styles.stepLineActive]} />}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
                    {order.status === step.key && (
                        <Text style={styles.currentStatusText}>Current Status</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Shipping Info */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>
            <Text style={styles.infoText}>{order.shipping.first_name} {order.shipping.last_name}</Text>
            <Text style={styles.infoText}>{order.shipping.address_1}</Text>
            <Text style={styles.infoText}>{order.shipping.city}, {order.shipping.state} {order.shipping.postcode}</Text>
            <Text style={styles.infoText}>{order.shipping.country}</Text>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.line_items.map((item, idx) => (
                <View key={item.id} style={[styles.itemRow, idx !== order.line_items.length - 1 && styles.itemBorder]}>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQty}>Qty: <Text>{item.quantity}</Text></Text>
                    </View>
                    <Text style={styles.itemPrice}>₹ {item.total}</Text>
                </View>
            ))}

            {/* Shipping Cost */}
            {order.shipping_lines && order.shipping_lines.map((shipping, idx) => (
                <View key={`ship-${idx}`} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping</Text>
                    <Text style={styles.summaryValue}>₹ {shipping.total}</Text>
                </View>
            ))}

            {/* Fees (e.g. COD & Discounts) */}
            {order.fee_lines && order.fee_lines.map((fee, idx) => {
                const isNegative = parseFloat(fee.total) < 0;
                return (
                    <View key={`fee-${idx}`} style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{fee.name}</Text>
                        <Text style={[styles.summaryValue, isNegative && { color: COLORS.success }]}>
                            ₹ {fee.total}
                        </Text>
                    </View>
                );
            })}
            
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹ {order.total}</Text>
            </View>
        </View>

        {/* Refunds Section */}
        {order.status === 'completed' && order.refunds && order.refunds.length > 0 && (
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Refunds</Text>
                {order.refunds.map((refund: any, idx: number) => (
                    <View key={refund.id || idx} style={styles.refundRow}>
                         <Text style={styles.refundReason}>{refund.reason || 'Refund'}</Text>
                         <Text style={styles.refundAmount}>- ₹ {refund.total}</Text>
                    </View>
                ))}
            </View>
        )}

        {order.status === 'completed' && (
          <TouchableOpacity 
              style={styles.supportBtn} 
              onPress={() => navigation.navigate('Refund', { orderId: order.id })}
          >
              <Text style={styles.supportBtnText}>Request Refund</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.cream,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepperContainer: {
    marginTop: 10,
  },
  stepRow: {
    flexDirection: 'row',
    height: 70, // Height for line connection
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    width: 40,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepDotActive: {
    backgroundColor: '#e6f4ea',
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  stepIcon: {
    fontSize: 14,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#f0f0f0',
    marginTop: -2, // pull up to connect
    marginBottom: -2, // pull down to connect next
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: COLORS.success,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 15,
    paddingTop: 5,
  },
  stepLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  currentStatusText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  itemQty: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  refundRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
  },
  refundReason: {
      color: COLORS.error,
      fontSize: 14,
  },
  refundAmount: {
      color: COLORS.error,
      fontWeight: 'bold',
  },
  supportBtn: {
      backgroundColor: '#f0f0f0',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
  },
  supportBtnText: {
      color: '#555',
      fontWeight: 'bold',
  }
});
