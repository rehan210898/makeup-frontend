import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing,
  withDelay
} from 'react-native-reanimated';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

// 1. Hanger Icon Path (Simplified)
const HANGER_PATH = "M12 6 C12 3 16 3 16 6 C16 8 14 9 12 9 L2 14 L22 14 L12 9 Z"; 

// 2. T-Shirt Icon Path
const TSHIRT_PATH = "M6 6 L2 10 L6 14 L6 28 L26 28 L26 14 L30 10 L26 6 L20 4 C20 4 18 8 16 8 C14 8 12 4 12 4 Z";

// 3. Shopping Bag Path
const BAG_PATH_BODY = "M5 10 L3 26 L21 26 L19 10 Z";
const BAG_PATH_HANDLE = "M8 10 C8 4 16 4 16 10";

// 4. Lipstick Path
const LIPSTICK_BASE = "M10 22 L10 28 L22 28 L22 22 Z";
const LIPSTICK_MID = "M11 18 L11 22 L21 22 L21 18 Z";
const LIPSTICK_TIP = "M12 10 L12 18 L20 18 L20 12 L12 10 Z";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedView = Animated.createAnimatedComponent(View);

export const FashionMicroAnimations = () => {
  const hangerRotation = useSharedValue(0);
  const tshirtScale = useSharedValue(1);
  const tshirtTranslateY = useSharedValue(0);
  const bagTranslateY = useSharedValue(0);
  const lipstickRotate = useSharedValue(0);

  useEffect(() => {
    // Swing animation for Hanger
    hangerRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Floating/Breathing animation for T-Shirt
    tshirtScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    
    tshirtTranslateY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

    // Bounce animation for Bag
    bagTranslateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1200, easing: Easing.bounce }),
        withTiming(0, { duration: 1200, easing: Easing.bounce })
      ),
      -1,
      true
    );

    // Wiggle animation for Lipstick
    lipstickRotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 300, easing: Easing.linear }),
        withTiming(-5, { duration: 300, easing: Easing.linear }),
        withTiming(5, { duration: 300, easing: Easing.linear }),
        withTiming(0, { duration: 1500 }) // Pause
      ),
      -1,
      true
    );
  }, []);

  const hangerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${hangerRotation.value}deg` }],
    };
  });

  const tshirtStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: tshirtScale.value }, 
        { translateY: tshirtTranslateY.value }
      ],
    };
  });

  const bagStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bagTranslateY.value }],
    };
  });

  const lipstickStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${lipstickRotate.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
            <Text style={styles.title}>Trending Now</Text>
            <Text style={styles.subtitle}>Check out what's hot this week</Text>
        </View>

        <View style={styles.iconsContainer}>
            {/* Animated Hanger */}
            <AnimatedView style={[styles.iconWrapper, hangerStyle]}>
              <Svg width="40" height="40" viewBox="0 0 24 24" stroke={COLORS.primary} strokeWidth="1.5" fill="none">
                <Path d="M12 8 L12 4 C12 4 12 1 15 1 C18 1 18 4 15 4" strokeLinecap="round" />
                <Path d="M12 8 L2 13 L22 13 Z" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </AnimatedView>

            {/* Animated T-Shirt */}
            <AnimatedView style={[styles.iconWrapper, tshirtStyle]}>
               <Svg width="40" height="40" viewBox="0 0 32 32" stroke={COLORS.accent} strokeWidth="1.5" fill="rgba(255, 120, 120, 0.1)">
                  <Path d={TSHIRT_PATH} strokeLinecap="round" strokeLinejoin="round" />
               </Svg>
            </AnimatedView>

            {/* Animated Shopping Bag */}
            <AnimatedView style={[styles.iconWrapper, bagStyle]}>
               <Svg width="36" height="36" viewBox="0 0 24 32" stroke={COLORS.primary} strokeWidth="1.5" fill="none">
                  <Path d={BAG_PATH_HANDLE} strokeLinecap="round" />
                  <Path d={BAG_PATH_BODY} strokeLinejoin="round" />
               </Svg>
            </AnimatedView>

            {/* Animated Lipstick */}
            <AnimatedView style={[styles.iconWrapper, lipstickStyle]}>
               <Svg width="32" height="32" viewBox="0 0 32 32" stroke={COLORS.accent} strokeWidth="1.5" fill="rgba(255, 120, 120, 0.2)">
                  <Path d={LIPSTICK_BASE} strokeLinejoin="round" />
                  <Path d={LIPSTICK_MID} strokeLinejoin="round" />
                  <Path d={LIPSTICK_TIP} strokeLinejoin="round" fill={COLORS.accent} />
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
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
    gap: 15,
    paddingRight: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
