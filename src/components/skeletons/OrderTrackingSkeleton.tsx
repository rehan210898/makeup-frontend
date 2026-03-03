import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { COLORS } from '../../constants';

const LIGHT_SHIMMER = 'rgba(255,255,255,0.15)';

export const OrderTrackingSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={32} height={32} borderRadius={8} style={{ backgroundColor: LIGHT_SHIMMER }} />
        <Skeleton width={120} height={18} borderRadius={4} style={{ backgroundColor: LIGHT_SHIMMER }} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card 1 - Status Stepper */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Skeleton width={100} height={16} borderRadius={4} />
            <Skeleton width={80} height={22} borderRadius={6} />
          </View>
          <View style={{ marginTop: 10 }}>
            {[1, 2, 3, 4].map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  <Skeleton width={32} height={32} borderRadius={16} />
                  {index < 3 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepContent}>
                  <Skeleton width={100} height={14} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Card 2 - Shipping */}
        <View style={styles.card}>
          <Skeleton width={130} height={16} borderRadius={4} style={{ marginBottom: 15 }} />
          <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width="85%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width="65%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>

        {/* Card 3 - Items */}
        <View style={styles.card}>
          <Skeleton width={50} height={16} borderRadius={4} style={{ marginBottom: 15 }} />
          {/* 2 item rows */}
          {[1, 2].map((item) => (
            <View key={item} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Skeleton width="75%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <Skeleton width="30%" height={12} borderRadius={4} />
              </View>
              <Skeleton width={60} height={14} borderRadius={4} />
            </View>
          ))}
          {/* Total row */}
          <View style={styles.totalRow}>
            <Skeleton width={90} height={16} borderRadius={4} />
            <Skeleton width={70} height={18} borderRadius={4} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

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
    backgroundColor: COLORS.primary,
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    height: 70,
  },
  stepIndicator: {
    alignItems: 'center',
    width: 40,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray[200],
    marginTop: -2,
    marginBottom: -2,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 15,
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
