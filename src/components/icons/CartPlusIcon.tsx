import React from 'react';
import Svg, { Circle, Path, Line } from 'react-native-svg';

export default function CartPlusIcon({ size = 24, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="21" r="1" />
      <Circle cx="20" cy="21" r="1" />
      <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      <Line x1="12" y1="9" x2="18" y2="9" />
      <Line x1="15" y1="6" x2="15" y2="12" />
    </Svg>
  );
}
