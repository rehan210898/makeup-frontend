import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useUserStore } from '../../store/userStore';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      console.log('Loading orders for user:', user?.id);
      if (!user) return;
      const data = await orderService.getOrders(user.id);
      console.log('Orders received:', data.length);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [user]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const status = order.status.toLowerCase();
      // Statuses: pending, processing, on-hold, completed, cancelled, refunded, failed, cancel-request, draft, checkout-draft, auto-draft
      if (activeTab === 'pending') {
        return ['pending', 'processing', 'on-hold', 'draft', 'checkout-draft', 'auto-draft', 'cancel-request'].includes(status);
      } else {
        return ['completed', 'cancelled', 'refunded', 'failed'].includes(status);
      }
    });
  }, [orders, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return COLORS.success;
      case 'processing': return COLORS.info;
      case 'on-hold': return COLORS.warning;
      case 'pending': return COLORS.warning;
      case 'cancelled': return COLORS.error;
      case 'refunded': return COLORS.gray[500]; // Gray for refunded
      case 'failed': return COLORS.error;
      case 'draft': 
      case 'auto-draft':
      case 'checkout-draft':
        return COLORS.gray[400];
      case 'cancel-request': return '#9333ea'; // Purple for request
      default: return COLORS.warning;
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.date}>
        {new Date(item.date_created).toLocaleDateString()}
      </Text>
      
      <View style={styles.divider} />
      
      <View style={styles.orderItems}>
        {item.line_items.map((lineItem) => (
          <Text key={lineItem.id} style={styles.itemText} numberOfLines={1}>
            {lineItem.quantity}x {lineItem.name}
          </Text>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>₹ {parseFloat(item.total).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.center}>
      <Text style={styles.emptyText}>No {activeTab} orders found</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            filteredOrders.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]} // Android
              tintColor={COLORS.primary} // iOS
            />
          }
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 10,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300, 
  },
  listContent: {
    padding: 20,
  },
  emptyListContent: {
    flexGrow: 1, 
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
