import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewToken, AppState, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
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
}

const MuteIcon: React.FC = () => (
  <View style={styles.muteIcon}>
    <View style={styles.muteBar} />
    <View style={[styles.muteBar, { height: 8 }]} />
    <View style={[styles.muteBar, { height: 12 }]} />
  </View>
);

const UnmuteIcon: React.FC = () => (
  <View style={styles.muteIcon}>
    <View style={[styles.muteBar, { height: 4, opacity: 0.4 }]} />
    <View style={[styles.muteBar, { height: 4, opacity: 0.4 }]} />
    <View style={[styles.muteBar, { height: 4, opacity: 0.4 }]} />
  </View>
);

interface VideoCardProps {
  item: VideoItem;
  isVisible: boolean;
  sectionActive: boolean;
}

const VideoCard = memo(({ item, isVisible, sectionActive }: VideoCardProps) => {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Video plays only when: card visible in horizontal list + section on screen + app in foreground
  const shouldPlay = isVisible && sectionActive;

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (!isLoaded) setIsLoaded(true);
    }
  }, [isLoaded]);

  // Stop and reset video position when section goes off screen
  useEffect(() => {
    if (!sectionActive && videoRef.current && isLoaded) {
      videoRef.current.stopAsync().catch(() => {});
    }
  }, [sectionActive, isLoaded]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const hasVideo = !!item.videoUrl && !hasError;

  return (
    <View style={styles.videoCard}>
      {/* Thumbnail — always rendered as base layer, shown when video not playing */}
      <Image
        source={{ uri: item.imageUrl }}
        style={[styles.videoImage, hasVideo && isLoaded && shouldPlay && styles.hidden]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        recyclingKey={`video-thumb-${item.id}`}
      />

      {/* Video player */}
      {hasVideo && (
        <Video
          ref={videoRef}
          source={{ uri: item.videoUrl! }}
          style={styles.videoPlayer}
          resizeMode={ResizeMode.COVER}
          shouldPlay={shouldPlay}
          isLooping
          isMuted={isMuted}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={() => setHasError(true)}
          posterSource={{ uri: item.imageUrl }}
          usePoster={true}
          posterStyle={styles.poster}
        />
      )}

      {/* Bottom gradient for title */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)']}
        locations={[0.4, 0.7, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Mute/Unmute toggle — only when playing */}
      {hasVideo && isLoaded && shouldPlay && (
        <TouchableOpacity
          style={styles.muteContainer}
          onPress={toggleMute}
          activeOpacity={0.7}
        >
          {isMuted ? <UnmuteIcon /> : <MuteIcon />}
        </TouchableOpacity>
      )}

      {/* Title */}
      <View style={styles.titleContainer} pointerEvents="none">
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </View>
  );
});

export const TrendingVideosSection: React.FC<TrendingVideosSectionProps> = ({
  title = 'Trending Now',
  videos,
}) => {
  const [visibleIds, setVisibleIds] = useState<Set<string | number>>(new Set());
  const [sectionVisible, setSectionVisible] = useState(false);
  const [appActive, setAppActive] = useState(true);
  const sectionRef = useRef<View>(null);
  const isFocused = useIsFocused();

  // Track app foreground/background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Track section visibility on screen using onLayout + measure
  const checkVisibility = useCallback(() => {
    if (!sectionRef.current) return;
    sectionRef.current.measure((_x, _y, _w, height, _px, pageY) => {
      // Section is visible if any part is within the viewport
      const screenHeight = Dimensions.get('window').height;
      const isOnScreen = pageY + height > 0 && pageY < screenHeight;
      setSectionVisible(isOnScreen);
    });
  }, []);

  // Poll visibility — runs only when screen is focused
  useEffect(() => {
    if (!isFocused) {
      setSectionVisible(false);
      return;
    }
    // Check immediately
    checkVisibility();
    // Check periodically (every 500ms is enough, low overhead)
    const interval = setInterval(checkVisibility, 500);
    return () => clearInterval(interval);
  }, [isFocused, checkVisibility]);

  const sectionActive = sectionVisible && appActive && isFocused;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = new Set<string | number>(
        viewableItems
          .filter(v => v.isViewable && v.item)
          .map(v => v.item.id)
      );
      setVisibleIds(ids);
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <VideoCard item={item} isVisible={visibleIds.has(item.id)} sectionActive={sectionActive} />
    ),
    [visibleIds, sectionActive]
  );

  if (!videos || videos.length === 0) return null;

  return (
    <View style={styles.container} ref={sectionRef}>
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
  videoPlayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  muteContainer: {
    position: 'absolute',
    bottom: 50,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  muteBar: {
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
