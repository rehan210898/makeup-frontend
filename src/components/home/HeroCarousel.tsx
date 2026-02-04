import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 420;

export interface CarouselSlide {
  imageUrl: string;
  badge?: {
    text: string;
    color?: string;
  };
  title: string;
  titleAccent?: string;
  description?: string;
  ctaText?: string;
  action?: {
    type: string;
    value: string | number;
    title?: string;
  };
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
}

const DotIndicator: React.FC<{
  index: number;
  activeIndex: number;
  total: number;
}> = ({ index, activeIndex, total }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = index === activeIndex;
    return {
      width: withTiming(isActive ? 24 : 8, { duration: 300 }),
      backgroundColor: withTiming(
        isActive ? COLORS.white : 'rgba(255, 255, 255, 0.5)',
        { duration: 300 }
      ),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides,
  autoPlayInterval = 5000,
}) => {
  const navigation = useNavigation<any>();
  const carouselRef = useRef<ICarouselInstance>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePress = (action?: CarouselSlide['action']) => {
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

  const renderSlide = ({ item, index }: { item: CarouselSlide; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.slide}
      onPress={() => handlePress(item.action)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.slideImage}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.85)']}
        locations={[0.3, 0.7, 1]}
        style={styles.gradient}
      />
      <View style={styles.slideContent}>
        {item.badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: item.badge.color || COLORS.primary },
            ]}
          >
            <Text style={styles.badgeText}>{item.badge.text}</Text>
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.title}</Text>
          {item.titleAccent && (
            <Text style={styles.titleAccent}> {item.titleAccent}</Text>
          )}
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.ctaText && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => handlePress(item.action)}
          >
            <Text style={styles.ctaText}>{item.ctaText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!slides || slides.length === 0) return null;

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        data={slides}
        renderItem={renderSlide}
        width={SCREEN_WIDTH}
        height={CAROUSEL_HEIGHT}
        autoPlay={slides.length > 1}
        autoPlayInterval={autoPlayInterval}
        loop={slides.length > 1}
        onSnapToItem={setActiveIndex}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10],
        }}
      />
      {slides.length > 1 && (
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <DotIndicator
              key={index}
              index={index}
              activeIndex={activeIndex}
              total={slides.length}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 50,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: FONTS.display.semiBold,
    fontSize: 11,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.serif.bold,
    fontSize: 32,
    color: COLORS.white,
    lineHeight: 38,
  },
  titleAccent: {
    fontFamily: FONTS.serif.boldItalic,
    fontSize: 32,
    color: COLORS.white,
    fontStyle: 'italic',
    lineHeight: 38,
  },
  description: {
    fontFamily: FONTS.display.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaText: {
    fontFamily: FONTS.display.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default HeroCarousel;
