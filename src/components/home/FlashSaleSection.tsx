import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import productService from '../../services/productService';
import { Product } from '../../types';
import ProductCard from '../products/ProductCard';
import { useWishlistStore } from '../../store/wishlistStore';
import { ProductCardSkeleton } from '../skeletons/ProductCardSkeleton';
import { Skeleton } from '../common/Skeleton';

interface FlashSaleSectionProps {
  title?: string;
  endTime?: string;
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
  const navigation = useNavigation<any>();
  const { itemIds: wishlistItemIds, addItem, removeItem } = useWishlistStore();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'flash-sale', productIds?.join(',') || 'default'],
    queryFn: async () => {
      if (productIds && productIds.length > 0) {
        const response = await productService.getProducts({
          // @ts-ignore
          include: productIds,
        });
        return response.data || [];
      }
      const response = await productService.getProducts({ on_sale: true, per_page: 10 });
      return response.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleProductPress = useCallback((id: number) => {
    navigation.navigate('ProductDetail', { productId: id });
  }, [navigation]);

  const toggleWishlist = useCallback((id: number) => {
    const isWishlisted = wishlistItemIds.includes(id);
    if (isWishlisted) {
      removeItem(id);
    } else {
      const product = products.find(p => p.id === id);
      if (product) addItem(product);
    }
  }, [wishlistItemIds, products, addItem, removeItem]);

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    const isWishlisted = wishlistItemIds.includes(item.id);
    return (
      <View style={{ width: 150 }}>
        <ProductCard
          item={item}
          onPress={handleProductPress}
          onWishlistPress={toggleWishlist}
          isWishlisted={isWishlisted}
          variant="default"
          index={index}
        />
      </View>
    );
  }, [handleProductPress, toggleWishlist, wishlistItemIds]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={120} height={24} borderRadius={4} />
          <Skeleton width={100} height={24} borderRadius={6} />
        </View>
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={() => (
            <View style={{ width: 150 }}>
              <ProductCardSkeleton />
            </View>
          )}
        />
      </View>
    );
  }

  if (products.length === 0) return null;

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
