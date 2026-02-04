import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import productService from '../../services/productService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';
import { useWishlistStore } from '../../store/wishlistStore';

interface FlashSaleSectionProps {
  title?: string;
  endTime?: string; // ISO date string
  productIds?: number[];
}

const CountdownTimer: React.FC<{ endTime: string }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerBox}>
        <Text style={styles.timerValue}>{formatNumber(timeLeft.hours)}</Text>
      </View>
      <Text style={styles.timerSeparator}>:</Text>
      <View style={styles.timerBox}>
        <Text style={styles.timerValue}>{formatNumber(timeLeft.minutes)}</Text>
      </View>
      <Text style={styles.timerSeparator}>:</Text>
      <View style={styles.timerBox}>
        <Text style={styles.timerValue}>{formatNumber(timeLeft.seconds)}</Text>
      </View>
    </View>
  );
};

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  title = 'Flash Sale',
  endTime,
  productIds,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { items: wishlistItems, addItem, removeItem } = useWishlistStore();

  useEffect(() => {
    loadProducts();
  }, [productIds]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let data: Product[];

      if (productIds && productIds.length > 0) {
        data = await productService.getProductsByIds(productIds);
      } else {
        const response = await productService.getProducts({ on_sale: true, per_page: 10 });
        data = response.data;
      }

      setProducts(data);
    } catch (error) {
      console.error('Error loading flash sale products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = useCallback((id: number) => {
    navigation.navigate('ProductDetail', { productId: id });
  }, [navigation]);

  const toggleWishlist = useCallback((id: number) => {
    const isWishlisted = wishlistItems.some(item => item.id === id);
    if (isWishlisted) {
      removeItem(id);
    } else {
      const product = products.find(p => p.id === id);
      if (product) addItem(product);
    }
  }, [wishlistItems, products, addItem, removeItem]);

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    const isWishlisted = wishlistItems.some(w => w.id === item.id);
    
    return (
      <View style={{ width: 150 }}>
        <ProductCard
          item={item}
          onPress={handleProductPress}
          onWishlistPress={toggleWishlist}
          isWishlisted={isWishlisted}
          variant="default" // Using default variant to match layout
          index={index}
        />
      </View>
    );
  }, [handleProductPress, toggleWishlist, wishlistItems]);

  if (products.length === 0 && !loading) return null;

  // Default end time: tomorrow at midnight
  const defaultEndTime = new Date();
  defaultEndTime.setDate(defaultEndTime.getDate() + 1);
  defaultEndTime.setHours(0, 0, 0, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Flash</Text>
          <Text style={styles.titleAccent}> Sale</Text>
        </View>
        <CountdownTimer endTime={endTime || defaultEndTime.toISOString()} />
      </View>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 22,
    color: COLORS.text.main,
  },
  titleAccent: {
    fontFamily: FONTS.serif.semiBoldItalic,
    fontSize: 22,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBox: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  timerValue: {
    fontFamily: FONTS.display.bold,
    fontSize: 14,
    color: COLORS.white,
  },
  timerSeparator: {
    fontFamily: FONTS.display.bold,
    fontSize: 14,
    color: COLORS.primary,
    marginHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default FlashSaleSection;