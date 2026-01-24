import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';

interface BannerSectionProps {
  imageUrl: string;
  action?: {
    type: string;
    value: string | number;
    title?: string;
    target_id?: number; // Keep for backward compatibility if any
  };
}

export const BannerSection: React.FC<BannerSectionProps> = ({ imageUrl, action }) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (!action) return;

    if (action.type === 'category') {
      navigation.navigate('ProductList', { 
        categoryId: Number(action.value || action.target_id), 
        categoryName: action.title 
      });
    } else if (action.type === 'filter') {
      navigation.navigate('ProductList', { 
        type: action.value,
        title: action.title 
      });
    } else if (action.type === 'product') {
      navigation.navigate('ProductDetail', { productId: Number(action.value || action.target_id) });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
