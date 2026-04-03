import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';
import { useCartStore } from '../../store/cartStore';
import CartIcon from '../../components/icons/CartIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import { FONTS } from '../../constants/fonts';
import { CategoriesSkeleton } from '../../components/skeletons/CategoriesSkeleton';
import layoutService, { CategoryLayoutItem } from '../../services/layoutService';
import { getIconForCategory } from '../../components/icons/CategoryIcons';

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CategoriesScreen() {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const [categories, setCategories] = useState<CategoryLayoutItem[]>([]);
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
      const data = await layoutService.getCategoryLayout();
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: CategoryLayoutItem) => {
    if (category.parent && category.parent > 0) {
      // It's a subcategory — find parent name from our list
      const parentCat = categories.find(c => c.id === category.parent);
      navigation.navigate('ProductList', {
        categoryId: category.id,
        categoryName: category.name,
        parentCategoryId: category.parent,
        parentCategoryName: parentCat?.name || undefined,
      });
    } else {
      // It's a main category
      navigation.navigate('ProductList', {
        categoryId: category.id,
        categoryName: category.name,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <CategoriesSkeleton />
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
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
            {categories.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() => handleCategoryPress(category)}
              >
                {category.image ? (
                  <View style={[styles.imageContainer, { backgroundColor: COLORS.pastels[index % COLORS.pastels.length] }]}>
                    <Image
                      source={{ uri: category.image }}
                      style={styles.categoryImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                      recyclingKey={`cat-screen-${category.id}`}
                    />
                  </View>
                ) : (
                  <View style={[styles.categoryIconBox, { backgroundColor: COLORS.pastels[index % COLORS.pastels.length] }]}>
                    {getIconForCategory(category.name, { size: 48, color: COLORS.primary })}
                  </View>
                )}

                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingBottom: 100,
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
    width: '31%',
    margin: '1.15%',
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    marginBottom: 10,
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 10,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  categoryIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginTop: 10,
  },
  categoryInfo: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 0,
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
