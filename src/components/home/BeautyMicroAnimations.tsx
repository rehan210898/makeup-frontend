import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing 
} from 'react-native-reanimated';
import { COLORS } from '../../constants';

// SVG Paths
const PERFUME_PATH = "M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2ZM10 15V20H14V15H10ZM11 21H13V22H11V21Z";
const BRUSH_PATH = "M18.5 2.5C18.5 2.5 13 8 13 8L16 11L21.5 5.5C22 5 22 3 21.5 2.5C21 2 19 2 18.5 2.5ZM12 9L9 12L3 18L2 22L6 21L12 15L15 12L12 9Z"; // Adjusted to look more like a brush
const COMPACT_PATH = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9 11h6v2H9z";
const SPARKLE_PATH = "M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9L12 0Z";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedView = Animated.createAnimatedComponent(View);

export const BeautyMicroAnimations = () => {
  const perfumeScale = useSharedValue(1);
  const brushRotate = useSharedValue(0);
  const compactRotate = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Perfume Pulse
    perfumeScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Brush Swipe
    brushRotate.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Compact Rotate
    compactRotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Sparkle Flash
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.4, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const perfumeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: perfumeScale.value }]
  }));

  const brushStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${brushRotate.value}deg` }]
  }));

  const compactStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${compactRotate.value}deg` }]
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleOpacity.value }]
  }));

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
            <Text style={styles.title}>Beauty Essentials</Text>
            <Text style={styles.subtitle}>Curated for your daily glow</Text>
        </View>

        <View style={styles.iconsContainer}>
            {/* Animated Perfume */}
            <AnimatedView style={[styles.iconWrapper, perfumeStyle]}>
              <Svg width="36" height="36" viewBox="0 0 24 24" stroke={COLORS.primary} strokeWidth="1.5" fill="none">
                <Path d={PERFUME_PATH} />
              </Svg>
            </AnimatedView>

            {/* Animated Brush */}
            <AnimatedView style={[styles.iconWrapper, brushStyle]}>
               <Svg width="36" height="36" viewBox="0 0 24 24" stroke={COLORS.accent} strokeWidth="1.5" fill="none">
                  <Path d={BRUSH_PATH} />
               </Svg>
            </AnimatedView>

            {/* Animated Compact */}
            <AnimatedView style={[styles.iconWrapper, compactStyle]}>
               <Svg width="36" height="36" viewBox="0 0 24 24" stroke={COLORS.primary} strokeWidth="1.5" fill="none">
                  <Path d={COMPACT_PATH} />
               </Svg>
            </AnimatedView>

             {/* Animated Sparkle */}
             <AnimatedView style={[styles.iconWrapper, sparkleStyle]}>
               <Svg width="32" height="32" viewBox="0 0 24 24" stroke="#FFD700" strokeWidth="1.5" fill="none">
                  <Path d={SPARKLE_PATH} />
               </Svg>
            </AnimatedView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  contentContainer: {
    backgroundColor: '#FFF5F5', // Light pinkish background
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 192, 203, 0.3)'
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  iconsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 5,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});