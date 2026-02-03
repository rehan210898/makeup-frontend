import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 220;

interface PromoBannerProps {
  imageUrl: string;
  title: string;
  titleAccent?: string;
  description?: string;
  ctaText?: string;
  action?: {
    type: string;
    value: string | number;
    title?: string;
  };
  gradientColors?: string[];
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  imageUrl,
  title,
  titleAccent,
  description,
  ctaText,
  action,
  gradientColors = ['rgba(0, 0, 0, 0.7)', 'transparent'],
}) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (!action) return;

    if (action.type === 'category') {
      navigation.navigate('ProductList', {
        categoryId: Number(action.value),
        categoryName: action.title,
      });
    } else if (action.type === 'filter') {
      navigation.navigate('ProductList', {
        type: action.value,
        title: action.title,
      });
    } else if (action.type === 'product') {
      navigation.navigate('ProductDetail', { productId: Number(action.value) });
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <View style={styles.banner}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {titleAccent && (
              <Text style={styles.titleAccent}> {titleAccent}</Text>
            )}
          </View>
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
          {ctaText && (
            <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
              <Text style={styles.ctaText}>{ctaText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '60%',
    padding: 24,
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.serif.bold,
    fontSize: 24,
    color: COLORS.white,
    lineHeight: 30,
  },
  titleAccent: {
    fontFamily: FONTS.serif.boldItalic,
    fontSize: 24,
    color: COLORS.white,
    fontStyle: 'italic',
    lineHeight: 30,
  },
  description: {
    fontFamily: FONTS.display.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 16,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ctaText: {
    fontFamily: FONTS.display.semiBold,
    fontSize: 13,
    color: COLORS.primary,
  },
});

export default PromoBanner;
