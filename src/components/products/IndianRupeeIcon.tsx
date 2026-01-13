// components/products/IndianRupeeIcon.tsx

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants';

interface IndianRupeeIconProps {
  size?: number;
  color?: string;
}

const IndianRupeeIcon = ({ size = 16, color = COLORS.primary }: IndianRupeeIconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={[styles.text, { fontSize: size, color }]}>₹</Text>
  </View>
);

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default IndianRupeeIcon;
