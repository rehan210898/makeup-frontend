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
}

export const CategoryGridSection: React.FC<CategoryGridSectionProps> = ({ title, categories: categoryIds }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories(1, 100);
      let loadedCats = response.data || [];
      
      if (categoryIds && categoryIds.length > 0) {
        loadedCats = loadedCats.filter(c => categoryIds.includes(c.id));
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

  if (!categories.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.grid}>
        {categories.map((item) => (
          <TouchableOpacity 
            key={item.id} 
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
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '23%', // 4 columns
    marginBottom: 15,
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
