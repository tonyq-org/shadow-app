import React from 'react';
import Svg, {Path, Circle, Rect, Line, G} from 'react-native-svg';

type IconProps = {size?: number; color?: string};

export function IconCard({size = 22, color = '#F6F1E3'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={6} width={18} height={13} rx={2.5} stroke={color} strokeWidth={1.3} fill="none" />
      <Line x1={3} y1={10.5} x2={21} y2={10.5} stroke={color} strokeWidth={1.3} />
      <Rect x={6.5} y={13.5} width={5} height={1.5} rx={0.5} fill={color} />
    </Svg>
  );
}

export function IconPlus({size = 22, color = '#F6F1E3'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1={12} y1={4} x2={12} y2={20} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconSend({size = 22, color = '#F6F1E3'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20 V4 M5 11 L12 4 L19 11" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconSettings({size = 22, color = '#F6F1E3'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={2.5} stroke={color} strokeWidth={1.3} fill="none" />
      <Path
        d="M12 3.5 L12 6 M12 18 L12 20.5 M3.5 12 L6 12 M18 12 L20.5 12 M5.6 5.6 L7.4 7.4 M16.6 16.6 L18.4 18.4 M5.6 18.4 L7.4 16.6 M16.6 7.4 L18.4 5.6"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconScan({size = 26, color = '#0A0B10'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 8 V5 A1 1 0 0 1 5 4 H8 M16 4 H19 A1 1 0 0 1 20 5 V8 M20 16 V19 A1 1 0 0 1 19 20 H16 M8 20 H5 A1 1 0 0 1 4 19 V16" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Line x1={7} y1={12} x2={17} y2={12} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevron({size = 18, color = '#F6F1E3', direction = 'right'}: IconProps & {direction?: 'right' | 'left' | 'down'}) {
  const rotate =
    direction === 'left' ? '180' : direction === 'down' ? '90' : '0';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{transform: [{rotate: `${rotate}deg`}]}}>
      <Path d="M9 6 L15 12 L9 18" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconClose({size = 18, color = '#F6F1E3'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconShield({size = 48, color = '#E8C97A'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M24 4 L40 10 V24 C40 33 32 42 24 44 C16 42 8 33 8 24 V10 Z"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M17 24 L22 29 L31 19" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCheck({size = 14, color = '#E8C97A'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12 L10 17 L19 7" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLog({size = 18, color = '#F6F1E3'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} strokeWidth={1.3} fill="none" />
      <Line x1={8} y1={9} x2={16} y2={9} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={8} y1={12} x2={16} y2={12} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={8} y1={15} x2={13} y2={15} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconFingerprint({size = 18, color = '#0A0B10'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M7 11 C7 7 9.2 4.5 12 4.5 C14.8 4.5 17 7 17 11 M6 15 C6 17 7 18.5 8 19.5 M18 15 C18 17.5 16.5 19 15 19.5 M10 10 C10 9 11 8 12 8 C13 8 14 9 14 10.5 C14 12 13.5 13 13 14.5 M8.5 12.5 C8.5 15 9.5 17 11 18"
        stroke={color}
        strokeWidth={1.3}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
