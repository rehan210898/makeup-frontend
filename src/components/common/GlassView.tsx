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
  intensity = 50,
  tint = 'light'
}) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView 
        intensity={intensity} 
        tint={tint} 
        style={StyleSheet.absoluteFill} 
      />
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
    borderColor: 'rgba(255, 255, 255, 0.4)',
    // Shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  content: {
    padding: 0, // Content container handles actual layout
  },
});

