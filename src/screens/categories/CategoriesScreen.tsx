import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import categoryService from '../../services/categoryService';
import { Category } from '../../types';
import { RootStackParamList } from '../../navigation/types';
import { getIconForCategory } from '../../components/icons/CategoryIcons';

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CategoriesScreen() {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await categoryService.getCategories();
      console.log('Categories response:', JSON.stringify(response.data?.[0], null, 2));
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.headerTitle}>📂 Categories</Text>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  content: {
    padding: 15,
    paddingBottom: 30, // Added padding to prevent overlapping with footer navigation
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontSize: 14,
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
    marginHorizontal: -4, // Reduced margin for tighter packing
  },
  categoryCard: {
    width: '31%', // Fits 3 columns comfortably (31 * 3 = 93 + margins)
    margin: '1.1%', // Small gap
    borderRadius: 12, // Slightly smaller radius for smaller cards
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 80, // Reduced height for 3-column layout
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
    height: 80, // Match image height
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
  },
  categoryIcon: {
    fontSize: 32, // Smaller icon
  },
  categoryInfo: {
    padding: 8, // Reduced padding
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F9F9F9',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 16,
    height: 32, // Fixed height for exactly 2 lines of text
  },
  categoryCount: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
});