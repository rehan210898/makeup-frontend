import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SplashScreenExpo from 'expo-splash-screen';
import { COLORS } from '../constants';
import { FONTS } from '../constants/fonts';
import { RootStackParamList } from '../navigation/types';
import { useUserStore } from '../store/userStore';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

SplashScreenExpo.preventAutoHideAsync().catch(() => {});

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { isAuthenticated, token, user, _hasHydrated } = useUserStore();

  // Animations
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const loaderOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate in
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    logoScale.value = withSequence(
      withTiming(1.05, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 200 })
    );
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    loaderOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!_hasHydrated) return;

      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        await SplashScreenExpo.hideAsync();

        if (isAuthenticated && token && user) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await SplashScreenExpo.hideAsync();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    checkAuth();
  }, [_hasHydrated, isAuthenticated, token, user, navigation]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const loaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.tagline, textAnimatedStyle]}>
          Beauty at your fingertips
        </Animated.Text>

        <Animated.View style={[styles.loaderContainer, loaderAnimatedStyle]}>
          <View style={styles.loaderTrack}>
            <LoadingBar />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// Animated loading bar
function LoadingBar() {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withTiming(100, { duration: 1200, easing: Easing.inOut(Easing.ease) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.loaderFill, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  tagline: {
    fontFamily: FONTS.serif.regular,
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 40,
  },
  loaderContainer: {
    width: 120,
    alignItems: 'center',
  },
  loaderTrack: {
    width: 120,
    height: 3,
    backgroundColor: COLORS.gray[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderFill: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
