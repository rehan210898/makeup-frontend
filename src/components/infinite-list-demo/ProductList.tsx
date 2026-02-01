import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { DemoProduct, fetchProducts } from './api';
import { ProductCard, CARD_HEIGHT, SPACING } from './ProductCard';

const PAGE_SIZE = 10;
const ITEM_HEIGHT = CARD_HEIGHT + SPACING; // Height + Bottom Margin

export default function InfiniteProductList() {
  const [products, setProducts] = useState<DemoProduct[]>([]);
  // ... state ...
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent multiple fetch calls
  const isFetching = useRef(false);

  const loadData = async (pageToLoad: number, shouldRefresh: boolean = false) => {
    if (isFetching.current) return;
    
    isFetching.current = true;
    setError(null);

    if (shouldRefresh) {
      setRefreshing(true);
    } else if (pageToLoad === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const newProducts = await fetchProducts(pageToLoad, PAGE_SIZE);

      if (shouldRefresh) {
        setProducts(newProducts);
        setHasMore(true);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      if (newProducts.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setPage(pageToLoad);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  };

  // Initial Load
  useEffect(() => {
    loadData(1);
  }, []);

  const handleRefresh = useCallback(() => {
    loadData(1, true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading && !error) {
      loadData(page + 1);
    }
  }, [loadingMore, hasMore, loading, page, error]);

  const handleCardPress = useCallback((item: DemoProduct) => {
    console.log('Pressed item:', item.id);
  }, []);

  const renderItem = useCallback(({ item }: { item: DemoProduct }) => (
    <ProductCard product={item} onPress={handleCardPress} />
  ), [handleCardPress]);

  const keyExtractor = useCallback((item: DemoProduct) => item.id.toString(), []);

  // Performance Optimization: Calculate exact layout
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * (Math.floor(index / 2)), // 2 columns
    index,
  }), []);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#661F1D" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    if (error) return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(page)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No products found.</Text>
      </View>
    );
  };

  // Simple Skeleton for Initial Load
  if (loading && !refreshing && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
           {[1, 2, 3, 4, 5, 6].map(i => (
             <View key={i} style={[styles.skeletonCard, { opacity: 0.5 }]} />
           ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        
        // Event Handlers
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} 
        
        // Components
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        
        // Performance Props
        getItemLayout={getItemLayout}
        removeClippedSubviews={true} 
        initialNumToRender={10} 
        maxToRenderPerBatch={10}
        windowSize={10} 
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingHorizontal: SPACING,
    paddingTop: SPACING,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#661F1D',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Skeleton Styles
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING,
    justifyContent: 'space-between'
  },
  skeletonCard: {
    width: (Dimensions.get('window').width - (SPACING * 3)) / 2,
    height: CARD_HEIGHT,
    backgroundColor: '#e1e4e8',
    marginBottom: SPACING,
    borderRadius: 12,
  },
});
