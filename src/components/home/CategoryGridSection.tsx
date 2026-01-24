import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import categoryService from '../../services/categoryService';
import { Category } from '../../types';

interface CategoryGridSectionProps {
  title: string;
  categories?: number[];
  images?: string[];
}

export const CategoryGridSection: React.FC<CategoryGridSectionProps> = ({ title, categories: categoryIds, images }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadCategories();
  }, [categoryIds, images]); // Reload if ids or images change

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories(1, 100);
      let loadedCats = response.data || [];
      
      if (categoryIds && categoryIds.length > 0) {
        // 1. Filter to get only requested categories
        loadedCats = loadedCats.filter(c => categoryIds.includes(c.id));
        
        // 2. Sort them to match the order in categoryIds
        loadedCats.sort((a, b) => {
          return categoryIds.indexOf(a.id) - categoryIds.indexOf(b.id);
        });

        // 3. Apply override images if provided
        if (images && images.length > 0) {
          loadedCats = loadedCats.map((cat, index) => {
            if (images[index]) {
              return {
                ...cat,
                image: images[index] // Override with the static image URL
              };
            }
            return cat;
          });
        }
      } else {
        // If no IDs provided, maybe just show top 4?
        loadedCats = loadedCats.slice(0, 8);
      }
      setCategories(loadedCats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handlePress = (category: Category) => {
    navigation.navigate('ProductList', { 
      categoryId: category.id, 
      categoryName: category.name 
    });
  };

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => handlePress(item)}
    >
      <View style={styles.imageContainer}>
       {/* Use image if available, else placeholder */}
       {item.image ? (
          <Image
            source={{ uri: typeof item.image === 'string' ? item.image : item.image.src }}
            style={styles.image}
            contentFit="cover"
          />
       ) : (
         <View style={styles.placeholder} />
       )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (!categories.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  item: {
    width: 80,
    alignItems: 'center',
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray[200],
  },
  name: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
