import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';

interface BannerSectionProps {
  imageUrl: string;
  action?: {
    type: string;
    target_id: number;
  };
}

export const BannerSection: React.FC<BannerSectionProps> = ({ imageUrl, action }) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (!action) return;

    if (action.type === 'category') {
      // Navigate to Category/ProductList with category filter
      navigation.navigate('ProductList', { 
        categoryId: action.target_id, 
        // categoryName: action.name 
      });
    } else if (action.type === 'product') {
      navigation.navigate('ProductDetail', { productId: action.target_id });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: COLORS.white,
    aspectRatio: 16/9,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
