import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import categoryService from '../../services/categoryService';
import { Category } from '../../types';

interface CategoryCircleSectionProps {
  title: string;
  categories?: number[];
  images?: string[];
  onViewAllPress?: () => void;
}

export const CategoryCircleSection: React.FC<CategoryCircleSectionProps> = ({
  title,
  categories: categoryIds,
  images,
  onViewAllPress,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadCategories();
  }, [categoryIds, images]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories(1, 100);
      let loadedCats = response.data || [];

      if (categoryIds && categoryIds.length > 0) {
        loadedCats = loadedCats.filter((c) => categoryIds.includes(c.id));
        loadedCats.sort((a, b) => categoryIds.indexOf(a.id) - categoryIds.indexOf(b.id));

        if (images && images.length > 0) {
          loadedCats = loadedCats.map((cat, index) => {
            if (images[index]) {
              return { ...cat, image: images[index] };
            }
            return cat;
          });
        }
      } else {
        loadedCats = loadedCats.slice(0, 8);
      }

      setCategories(loadedCats);
      if (loadedCats.length > 0) {
        setSelectedId(loadedCats[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handlePress = (category: Category) => {
    setSelectedId(category.id);
    navigation.navigate('ProductList', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
    } else {
      navigation.navigate('CategoriesTab');
    }
  };

  const renderItem = ({ item, index }: { item: Category; index: number }) => {
    const isSelected = item.id === selectedId || index === 0;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.imageContainer,
            isSelected && styles.imageContainerSelected,
          ]}
        >
          {item.image ? (
            <Image
              source={{
                uri: typeof item.image === 'string' ? item.image : item.image.src,
              }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
        <Text
          style={[styles.name, isSelected && styles.nameSelected]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!categories.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
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
  title: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 20,
    color: COLORS.text.main,
  },
  viewAll: {
    fontFamily: FONTS.display.medium,
    fontSize: 14,
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  item: {
    width: 76,
    alignItems: 'center',
  },
  imageContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.backgroundSubtle,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageContainerSelected: {
    borderColor: COLORS.primary,
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
    fontFamily: FONTS.display.medium,
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  nameSelected: {
    color: COLORS.primary,
    fontFamily: FONTS.display.semiBold,
  },
});

export default CategoryCircleSection;
