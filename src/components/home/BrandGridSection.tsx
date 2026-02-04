import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import BrandService, { Brand } from '../../services/BrandService';

interface BrandGridSectionProps {
  title: string;
  ids?: number[];
  images?: string[];
}

export const BrandGridSection: React.FC<BrandGridSectionProps> = ({ title, ids, images }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadBrands();
  }, [ids, images]);

  const loadBrands = async () => {
    try {
      let loadedBrands = await BrandService.getBrands(ids);
      
      // Apply override images if provided
      if (images && images.length > 0) {
        loadedBrands = loadedBrands.map((brand, index) => {
          if (images[index]) {
            return {
              ...brand,
              image: images[index]
            };
          }
          return brand;
        });
      }
      setBrands(loadedBrands);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const handlePress = (brand: Brand) => {
    // Navigate to ProductList with attribute filter
    navigation.navigate('ProductList', { 
      attribute: 'pa_brand',
      termId: brand.id,
      title: brand.name 
    });
  };

  const renderItem = ({ item }: { item: Brand }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => handlePress(item)}
    >
      <View style={styles.imageContainer}>
       {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            contentFit="cover"
          />
       ) : (
         <View style={styles.placeholder}>
             <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
         </View>
       )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (!brands.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={brands}
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
    fontFamily: FONTS.serif.semiBold,
    fontSize: 20,
    color: COLORS.text.main,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: FONTS.display.bold,
    fontSize: 24,
    color: COLORS.primary,
  },
  name: {
    fontFamily: FONTS.display.medium,
    fontSize: 12,
    color: COLORS.text.main,
    textAlign: 'center',
  },
});
