import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';

const CARD_WIDTH = 160;
const CARD_HEIGHT = 280;

interface VideoItem {
  id: string | number;
  imageUrl: string;
  title: string;
  videoUrl?: string;
}

interface TrendingVideosSectionProps {
  title?: string;
  videos: VideoItem[];
  onVideoPress?: (video: VideoItem) => void;
}

const PlayIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <View style={[styles.playIcon, { width: size, height: size, borderRadius: size / 2 }]}>
    <View
      style={[
        styles.playTriangle,
        {
          borderLeftWidth: size * 0.35,
          borderTopWidth: size * 0.2,
          borderBottomWidth: size * 0.2,
        },
      ]}
    />
  </View>
);

const VolumeIcon: React.FC = () => (
  <View style={styles.volumeIcon}>
    <View style={styles.volumeBar} />
    <View style={[styles.volumeBar, { height: 8 }]} />
    <View style={[styles.volumeBar, { height: 12 }]} />
  </View>
);

export const TrendingVideosSection: React.FC<TrendingVideosSectionProps> = ({
  title = 'Trending Now',
  videos,
  onVideoPress,
}) => {
  const handlePress = (video: VideoItem) => {
    if (onVideoPress) {
      onVideoPress(video);
    }
  };

  const renderItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => handlePress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.videoImage}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)']}
        locations={[0.4, 0.7, 1]}
        style={styles.gradient}
      />

      {/* Play Button */}
      <View style={styles.playButtonContainer}>
        <PlayIcon />
      </View>

      {/* Volume Icon */}
      <TouchableOpacity style={styles.volumeContainer}>
        <VolumeIcon />
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!videos || videos.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FlatList
        data={videos}
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 20,
    color: COLORS.text.main,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  videoCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.gray[200],
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  playIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: COLORS.primary,
    marginLeft: 4,
  },
  volumeContainer: {
    position: 'absolute',
    bottom: 50,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  volumeBar: {
    width: 3,
    height: 6,
    backgroundColor: COLORS.white,
    borderRadius: 1,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  videoTitle: {
    fontFamily: FONTS.display.semiBold,
    fontSize: 13,
    color: COLORS.white,
    lineHeight: 18,
  },
});

export default TrendingVideosSection;
