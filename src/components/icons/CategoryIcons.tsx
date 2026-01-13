import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const defaultProps = {
  size: 24,
  color: '#000',
  strokeWidth: 1.5,
};

export const FoundationIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 12h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z" />
    <Path d="M9 12V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8" />
    <Path d="M6 12h12" />
  </Svg>
);

export const PowderIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 17a5 5 0 0 0 0-10" />
  </Svg>
);

export const LipstickIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10 14h4v7a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-7z" />
    <Rect x="7" y="10" width="10" height="4" rx="1" />
    <Path d="M12 3l-3 7h6l-3-7z" />
  </Svg>
);

export const EyeshadowIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
    <Line x1="12" y1="10" x2="12" y2="20" />
    <Circle cx="7" cy="15" r="2" />
    <Circle cx="17" cy="15" r="2" />
  </Svg>
);

export const MascaraIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2v8" />
    <Path d="M9 10h6v12a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-12z" />
    <Path d="M12 2l2 2" />
    <Path d="M12 2l-2 2" />
    <Path d="M12 4l2 2" />
    <Path d="M12 4l-2 2" />
  </Svg>
);

export const BrushIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 21v-5" />
    <Path d="M9 16v-2c0-1.1.9-2 2-2s2 .9 2 2v2H9z" />
    <Path d="M12 12V3" />
    <Path d="M8 5l4-2 4 2" />
  </Svg>
);

export const SprayIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10z" />
    <Path d="M11 10V6" />
    <Path d="M8 6h6" />
    <Path d="M11 6V3" />
    <Path d="M14 6l-3-3-3 3" />
    <Path d="M18 13l2-2" />
    <Path d="M18 16l3 1" />
  </Svg>
);

export const SerumIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14.5 10.5L10 6" />
    <Path d="M16 12a5.6 5.6 0 0 1-4 8.5 5.6 5.6 0 0 1-4-8.5l4-4 4 4z" />
    <Path d="M12 3v3" />
    <Path d="M12 3a2 2 0 0 1 2 2" />
  </Svg>
);

export const EyelinerIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 22l10-10" />
    <Path d="M12 12l2-2" />
    <Path d="M16 8l4-4" />
    <Path d="M22 2l-4 4" />
  </Svg>
);

export const PaletteIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="8" cy="10" r="2" />
    <Circle cx="16" cy="10" r="2" />
    <Circle cx="12" cy="16" r="2" />
  </Svg>
);

export const DefaultIcon = ({ size = 24, color = '#000', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <Circle cx="12" cy="12" r="5" />
  </Svg>
);

// Mapping function
export const getIconForCategory = (categoryName: string, props: IconProps) => {
  if (!categoryName) return <DefaultIcon {...props} />;
  
  const name = categoryName.toLowerCase();
  
  if (name.includes('foundation') || name.includes('bb') || name.includes('cc')) return <FoundationIcon {...props} />;
  if (name.includes('powder') || name.includes('compact')) return <PowderIcon {...props} />;
  if (name.includes('lipstick') || name.includes('lip')) return <LipstickIcon {...props} />;
  if (name.includes('shadow')) return <EyeshadowIcon {...props} />;
  if (name.includes('mascara') || name.includes('lash') || name.includes('falsies')) return <MascaraIcon {...props} />;
  if (name.includes('brush')) return <BrushIcon {...props} />;
  if (name.includes('spray') || name.includes('fixer')) return <SprayIcon {...props} />;
  if (name.includes('serum') || name.includes('oil')) return <SerumIcon {...props} />;
  if (name.includes('liner') || name.includes('kajal') || name.includes('pencil')) return <EyelinerIcon {...props} />;
  if (name.includes('palette') || name.includes('contour') || name.includes('highlight') || name.includes('blush')) return <PaletteIcon {...props} />;
  
  return <DefaultIcon {...props} />;
};
