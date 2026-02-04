import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number; 
  tint?: 'light' | 'dark' | 'default';
}

export const GlassView: React.FC<GlassViewProps> = ({ 
  children, 
  style, 
  intensity = 30, // Slightly reduced default intensity for premium feel
  tint = 'light'
}) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView 
        intensity={intensity} 
        tint={tint} 
        style={StyleSheet.absoluteFill} 
      />
      <View style={[
        StyleSheet.absoluteFill, 
        { backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' } 
      ]} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden', // Required for BlurView to respect border radius
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtler border
    // Soft Shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    padding: 0,
  },
});

