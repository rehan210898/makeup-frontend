import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { COLORS, API_CONFIG } from '../../constants';
import { useRefundOrder } from '../../hooks/useRefundOrder';
import { Order, OrderLineItem } from '../../types';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';

// Zod Schema for Validation
const refundSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  reason: z.string().optional(),
  api_refund: z.boolean(),
  line_items: z.array(z.object({
    id: z.number(),
    quantity: z.number(),
    refund_total: z.string().optional()
  })).optional()
});

const fetchOrder = async (orderId: number) => {
  const { data } = await axios.get(`${API_CONFIG.BASE_URL}/orders/${orderId}`, {
      headers: { 'X-API-Key': API_CONFIG.API_KEY }
  });
  return data.data as Order;
};

export default function RefundScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { orderId } = route.params || {};
  
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
  });

  const { mutate: refundOrder, isPending: isRefunding } = useRefundOrder();

  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState('');
  const [apiRefund, setApiRefund] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{[key: number]: number}>({}); // itemId -> qty

  // Initialize selected items with 0
  useEffect(() => {
    if (order?.line_items) {
      const initial: any = {};
      order.line_items.forEach(item => initial[item.id] = 0);
      setSelectedItems(initial);
    }
  }, [order]);

  const calculateRefundAmount = useMemo(() => {
    if (!order) return '0.00';
    
    if (refundType === 'full') {
      return order.total;
    } else {
      let total = 0;
      order.line_items.forEach(item => {
        const qty = selectedItems[item.id] || 0;
        if (qty > 0) {
            // Calculate unit price approximately from total/quantity since unit price might not be explicitly clean
            // Or use item.price (number)
            // item.total is the line total string.
            const unitPrice = parseFloat(item.total) / item.quantity;
            total += unitPrice * qty;
        }
      });
      return total.toFixed(2);
    }
  }, [order, refundType, selectedItems]);

  const handleQuantityChange = (itemId: number, change: number, max: number) => {
    const current = selectedItems[itemId] || 0;
    const newQty = Math.max(0, Math.min(max, current + change));
    setSelectedItems(prev => ({ ...prev, [itemId]: newQty }));
  };

  const handleConfirmRefund = () => {
    if (!order) return;
    
    const amount = calculateRefundAmount;
    const lineItemsPayload = refundType === 'partial' 
        ? Object.entries(selectedItems)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => {
                const item = order.line_items.find(i => i.id === Number(id));
                const unitPrice = item ? parseFloat(item.total) / item.quantity : 0;
                return {
                    id: Number(id),
                    quantity: qty,
                    refund_total: (unitPrice * qty).toFixed(2)
                };
            })
        : undefined;

    const payload = {
        orderId: order.id,
        amount: amount,
        reason: reason,
        api_refund: apiRefund,
        line_items: lineItemsPayload
    };

    // Validation
    try {
        refundSchema.parse(payload);
        
        if (parseFloat(amount) <= 0) {
            Alert.alert("Invalid Amount", "Refund amount must be greater than 0");
            return;
        }
        if (parseFloat(amount) > parseFloat(order.total)) {
             Alert.alert("Invalid Amount", "Refund amount cannot exceed order total");
             return;
        }

        Alert.alert(
            "Confirm Refund",
            `Are you sure you want to refund ₹ ${amount}?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Refund", 
                    style: 'destructive',
                    onPress: () => refundOrder(payload, {
                        onSuccess: () => navigation.goBack()
                    })
                }
            ]
        );

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            Alert.alert("Validation Error", err.issues[0].message);
        } else {
            Alert.alert("Error", "Invalid refund data");
        }
    }
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (error || !order) return <View style={styles.center}><Text>Error loading order</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeftIcon color={COLORS.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refund Order #{order.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section A: Order Summary */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Order Total</Text>
                <Text style={styles.value}>₹ {order.total}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Refundable Amount</Text>
                <Text style={[styles.value, {color: COLORS.success}]}>₹ {order.total}</Text>
            </View>
        </View>

        {/* Section B: Refund Type */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Refund Type</Text>
            <View style={styles.toggleContainer}>
                <TouchableOpacity 
                    style={[styles.toggleBtn, refundType === 'full' && styles.toggleBtnActive]}
                    onPress={() => setRefundType('full')}
                >
                    <Text style={[styles.toggleText, refundType === 'full' && styles.toggleTextActive]}>Full Refund</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.toggleBtn, refundType === 'partial' && styles.toggleBtnActive]}
                    onPress={() => setRefundType('partial')}
                >
                    <Text style={[styles.toggleText, refundType === 'partial' && styles.toggleTextActive]}>Partial Refund</Text>
                </TouchableOpacity>
            </View>

            {refundType === 'partial' && (
                <View style={styles.itemsList}>
                    {order.line_items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={{flex: 1}}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>₹ {(parseFloat(item.total)/item.quantity).toFixed(2)} each</Text>
                            </View>
                            <View style={styles.qtyControl}>
                                <TouchableOpacity onPress={() => handleQuantityChange(item.id, -1, item.quantity)} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
                                <Text style={styles.qtyText}>{selectedItems[item.id] || 0}</Text>
                                <TouchableOpacity onPress={() => handleQuantityChange(item.id, 1, item.quantity)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>

        {/* Section C: Details */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <Text style={styles.label}>Refund Reason (Optional)</Text>
            <TextInput 
                style={styles.input}
                placeholder="e.g. Damaged item"
                value={reason}
                onChangeText={setReason}
            />

            <View style={[styles.row, {marginTop: 10}]}>
                <Text style={styles.label}>Refund via Payment Gateway</Text>
                <Switch 
                    value={apiRefund} 
                    onValueChange={setApiRefund}
                    trackColor={{ false: "#767577", true: COLORS.primary }}
                />
            </View>
        </View>

        {/* Total to Refund Display */}
        <View style={styles.totalRefundContainer}>
            <Text style={styles.totalRefundLabel}>Total Refund Amount</Text>
            <Text style={styles.totalRefundValue}>₹ {calculateRefundAmount}</Text>
        </View>

      </ScrollView>

      {/* Section D: Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.confirmBtn, (parseFloat(calculateRefundAmount) <= 0 || isRefunding) && styles.disabledBtn]}
            onPress={handleConfirmRefund}
            disabled={parseFloat(calculateRefundAmount) <= 0 || isRefunding}
        >
            {isRefunding ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Refund</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.cream },
  backBtn: { padding: 5 },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4, marginBottom: 15 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { fontSize: 14, color: '#666', fontWeight: '500' },
  toggleTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#f9f9f9' },
  itemsList: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemPrice: { fontSize: 12, color: '#888' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  totalRefundContainer: { alignItems: 'center', marginBottom: 20 },
  totalRefundLabel: { fontSize: 14, color: '#666' },
  totalRefundValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  confirmBtn: { backgroundColor: COLORS.error, padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
