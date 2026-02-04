import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RewardProgramCardProps {
  title?: string;
  description?: string;
  ctaText?: string;
  onPress?: () => void;
}

const GiftIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <View style={[styles.giftIcon, { width: size, height: size }]}>
    {/* Gift box body */}
    <View style={styles.giftBody}>
      <View style={styles.giftRibbon} />
    </View>
    {/* Gift bow */}
    <View style={styles.giftBowContainer}>
      <View style={styles.giftBowLeft} />
      <View style={styles.giftBowCenter} />
      <View style={styles.giftBowRight} />
    </View>
  </View>
);

export const RewardProgramCard: React.FC<RewardProgramCardProps> = ({
  title = 'Join Our Rewards Program',
  description = 'Earn points on every purchase and unlock exclusive perks, early access to sales, and birthday rewards.',
  ctaText = 'Learn More',
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Background decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <GiftIcon size={40} />
          </View>

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {/* CTA Button */}
          <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
            <Text style={styles.ctaText}>{ctaText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 24,
    padding: 32,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primarySoft,
    opacity: 0.5,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySoft,
    opacity: 0.3,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  giftIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftBody: {
    width: 28,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  giftRibbon: {
    width: 4,
    height: '100%',
    backgroundColor: COLORS.accent,
    position: 'absolute',
  },
  giftBowContainer: {
    position: 'absolute',
    top: -4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftBowLeft: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: -2,
  },
  giftBowCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    zIndex: 1,
  },
  giftBowRight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginLeft: -2,
  },
  title: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: 22,
    color: COLORS.text.main,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: FONTS.display.regular,
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  ctaText: {
    fontFamily: FONTS.display.semiBold,
    fontSize: 14,
    color: COLORS.white,
  },
});

export default RewardProgramCard;
