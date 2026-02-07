import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import categoryService from '../../services/categoryService';
import { Category } from '../../types';
import { RootStackParamList } from '../../navigation/types';
import { getIconForCategory } from '../../components/icons/CategoryIcons';
import { useCartStore } from '../../store/cartStore';
import CartIcon from '../../components/icons/CartIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import { FONTS } from '../../constants/fonts';

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CategoriesScreen() {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { itemCount } = useCartStore();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await categoryService.getCategories();
      // console.log('Categories loaded');
      setCategories(response.data || []);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get image URL
  const getCategoryImageUrl = (category: Category): string | null => {
    if (!category.image) return null;
    
    // If image is a string, return it
    if (typeof category.image === 'string') {
      return category.image;
    }
    
    // If image is an object with src property
    if (typeof category.image === 'object' && 'src' in category.image) {
      return category.image.src;
    }
    
    return null;
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('ProductList', { 
      categoryId: category.id,
      categoryName: category.name
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Matching ProductList/Home Style */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
            <SearchIcon size={18} color={COLORS.text.muted} />
            <TextInput 
                placeholder="Search products..." 
                placeholderTextColor={COLORS.text.muted}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={(e) => navigation.push('ProductList', { search: e.nativeEvent.text })}
            />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'CartTab' } as any)} style={styles.cartBtn}>
            <CartIcon size={24} color={COLORS.primary} />
            {itemCount > 0 && (
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
            )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: COLORS.primary }]}
              onPress={loadCategories}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && categories.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        )}

       {!loading && !error && categories.length > 0 && (
  <View style={styles.categoriesGrid}>
    {categories.filter(c => (c.count || 0) > 0).map((category) => {
      const imageUrl = getCategoryImageUrl(category);
      
      return (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryCard}
          activeOpacity={0.7}
          onPress={() => handleCategoryPress(category)}
        >
          {/* Category Image - Full width rectangle */}
          {imageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.categoryImage}
                resizeMode="cover"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            </View>
          ) : (
            <View style={styles.categoryIconBox}>
              {getIconForCategory(category.name, { size: 48, color: COLORS.primary })}
            </View>
          )}
          
          {/* Category Info Below Image */}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {category.name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text.main,
    padding: 0,
    fontFamily: FONTS.display.medium,
  },
  cartBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    zIndex: 10,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: FONTS.display.bold,
  },
  content: {
    padding: 15,
    paddingBottom: 100, // Fixed padding
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.display.medium,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryCard: {
    width: '31%', // Fits 3 columns
    margin: '1.15%', 
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imageContainer: {
    width: '100%',
    height: 90,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryIconBox: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  categoryInfo: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FAFAFA',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.main,
    textAlign: 'center',
    lineHeight: 16,
    height: 32,
    fontFamily: FONTS.display.medium,
  },
});