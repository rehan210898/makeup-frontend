import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { DemoProduct } from './api';

const { width } = Dimensions.get('window');
export const CARD_HEIGHT = 280;
export const SPACING = 10;
// Calculate width: (Screen Width - (3 * SPACING)) / 2
// 3 spacings: Left edge, Middle gap, Right edge
const CARD_WIDTH = (width - (SPACING * 3)) / 2;

interface ProductCardProps {
  product: DemoProduct;
  onPress: (product: DemoProduct) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: product.image }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
        <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 12,
    // Margin removed, handled by parent container gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: SPACING, // Only bottom margin needed for row spacing
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#661F1D',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

// Memoize to prevent re-renders unless props change
export const ProductCard = memo(ProductCardComponent, (prev, next) => {
  return prev.product.id === next.product.id;
});
