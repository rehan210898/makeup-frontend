import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BottomTabParamList } from './types';
import { COLORS } from '../constants';
import { FONTS } from '../constants/fonts';
import { useCartStore } from '../store/cartStore';
import { haptic } from '../utils/haptics';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import CartScreen from '../screens/cart/CartScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Icons
import HomeIcon from '../components/icons/HomeIcon';
import GridIcon from '../components/icons/GridIcon';
import CartIcon from '../components/icons/CartIcon';
import UserIcon from '../components/icons/UserIcon';

const Tab = createBottomTabNavigator<BottomTabParamList>();

interface AnimatedTabIconProps {
  IconComponent: React.FC<{ color: string; size: number }>;
  color: string;
  size: number;
  focused: boolean;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  IconComponent,
  color,
  size,
  focused,
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
      translateY.value = withSequence(
        withSpring(-4, { damping: 10, stiffness: 400 }),
        withSpring(0, { damping: 10, stiffness: 400 })
      );
    }
  }, [focused, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent color={color} size={size} />
    </Animated.View>
  );
};

interface AnimatedCartBadgeProps {
  count: number;
}

const AnimatedCartBadge: React.FC<AnimatedCartBadgeProps> = ({ count }) => {
  const scale = useSharedValue(0);
  const prevCount = useSharedValue(count);

  useEffect(() => {
    if (count > 0 && count !== prevCount.value) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 8, stiffness: 400 })
      );
      haptic.light();
    } else if (count > 0 && prevCount.value === 0) {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    } else if (count === 0) {
      scale.value = withTiming(0, { duration: 200 });
    }
    prevCount.value = count;
  }, [count, scale, prevCount]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </Animated.View>
  );
};

export default function BottomTabNavigator() {
  const itemCount = useCartStore((state) => state.itemCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : COLORS.white,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={90}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: FONTS.display.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              IconComponent={HomeIcon}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => haptic.selection(),
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              IconComponent={GridIcon}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => haptic.selection(),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Bag',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ width: size, height: size, overflow: 'visible' }}>
              <AnimatedTabIcon
                IconComponent={CartIcon}
                color={color}
                size={size}
                focused={focused}
              />
              <AnimatedCartBadge count={itemCount} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => haptic.selection(),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              IconComponent={UserIcon}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => haptic.selection(),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 10,
    elevation: 5,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.display.bold,
  },
});
