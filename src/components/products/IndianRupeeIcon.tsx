import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../constants';

interface IndianRupeeIconProps {
  size?: number;
  color?: string;
}

const IndianRupeeIcon = ({ size = 16, color = COLORS.primary }: IndianRupeeIconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="40 -1 170 250">
      <Path 
        fill={color} 
        d="M153 23h41l15-23H55L40 23h26c27 0 52 2 62 25H55L40 71h91v1c0 17-14 43-60 43H48v22l90 113h41L85 133c39-2 75-24 80-62h29l15-23h-45c-1-9-5-18-11-25z" 
      />
    </Svg>
  </View>
);

export default IndianRupeeIcon;
