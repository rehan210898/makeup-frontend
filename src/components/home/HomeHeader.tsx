import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import SearchIcon from '../icons/SearchIcon';

interface HomeHeaderProps {
  onSearchPress: () => void;
  userAvatar?: string;
  userName?: string;
  isOnline?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onSearchPress,
  userAvatar,
  userName = 'Guest',
  isOnline = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {Platform.OS === 'ios' && (
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      )}

      <View style={styles.content}>
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={onSearchPress}
          activeOpacity={0.8}
        >
          <SearchIcon size={20} color={COLORS.text.muted} />
          <Text style={styles.searchPlaceholder}>Search for products...</Text>
        </TouchableOpacity>

        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : COLORS.white,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSubtle,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 10,
  },
  searchPlaceholder: {
    fontFamily: FONTS.display.regular,
    fontSize: 15,
    color: COLORS.text.muted,
  },
  logoContainer: {
    padding: 2,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  // Removed avatar styles as they are no longer used
});

export default HomeHeader;
