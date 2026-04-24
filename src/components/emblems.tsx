import React from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Rect,
  Defs,
  Pattern,
  Ellipse,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {colors} from '../theme/tokens';

type EmblemProps = {
  size?: number;
  color?: string;
};

export function EmblemID({size = 56, color = colors.brand.brass}: EmblemProps) {
  const ticks = [0, 60, 120, 180, 240, 300].map(a => {
    const rad = (a * Math.PI) / 180;
    return {
      x1: 28 + Math.cos(rad) * 13,
      y1: 28 + Math.sin(rad) * 13,
      x2: 28 + Math.cos(rad) * 19,
      y2: 28 + Math.sin(rad) * 19,
      key: a,
    };
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx={28} cy={28} r={26} stroke={color} strokeWidth={1} strokeOpacity={0.4} fill="none" />
      <Circle cx={28} cy={28} r={20} stroke={color} strokeWidth={0.5} strokeOpacity={0.5} fill="none" />
      <Circle cx={28} cy={28} r={10} stroke={color} strokeWidth={1} fill="none" />
      <Circle cx={28} cy={28} r={3} fill={color} />
      {ticks.map(t => (
        <Line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

export function EmblemDiploma({size = 56, color = colors.brand.brass}: EmblemProps) {
  const spikes = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx={28} cy={28} r={26} stroke={color} strokeWidth={1} strokeOpacity={0.4} fill="none" />
      {spikes.map(a => (
        <Polygon
          key={a}
          points="28,14 30,22 28,20 26,22"
          fill={color}
          transform={`rotate(${a} 28 28)`}
        />
      ))}
      <Circle cx={28} cy={28} r={7} stroke={color} strokeWidth={1.2} fill="none" />
      <Path d="M24 28 L27 31 L32 25" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EmblemHealth({size = 56, color = colors.brand.brass}: EmblemProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx={28} cy={28} r={26} stroke={color} strokeWidth={1} strokeOpacity={0.4} fill="none" />
      <Rect x={24} y={14} width={8} height={28} fill={color} rx={1} />
      <Rect x={14} y={24} width={28} height={8} fill={color} rx={1} />
    </Svg>
  );
}

export function EmblemDriver({size = 56, color = colors.brand.brass}: EmblemProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx={28} cy={28} r={26} stroke={color} strokeWidth={1} strokeOpacity={0.4} fill="none" />
      <Circle cx={28} cy={28} r={14} stroke={color} strokeWidth={1.2} fill="none" />
      <Circle cx={28} cy={28} r={4} fill={color} />
      <Path d="M28 14 L28 19 M28 37 L28 42 M14 28 L19 28 M37 28 L42 28" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M18 18 L21.5 21.5 M34.5 34.5 L38 38 M38 18 L34.5 21.5 M21.5 34.5 L18 38" stroke={color} strokeWidth={1} strokeLinecap="round" strokeOpacity={0.6} />
    </Svg>
  );
}

export function EmblemMembership({size = 56, color = colors.brand.brass}: EmblemProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx={28} cy={28} r={26} stroke={color} strokeWidth={1} strokeOpacity={0.4} fill="none" />
      <Polygon
        points="28,12 31,23 42,23 33,30 36,41 28,34 20,41 23,30 14,23 25,23"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type EmblemKey = 'id' | 'diploma' | 'health' | 'driver' | 'membership';

export function Emblem({emblem, size, color}: {emblem: EmblemKey; size?: number; color?: string}) {
  switch (emblem) {
    case 'diploma':
      return <EmblemDiploma size={size} color={color} />;
    case 'health':
      return <EmblemHealth size={size} color={color} />;
    case 'driver':
      return <EmblemDriver size={size} color={color} />;
    case 'membership':
      return <EmblemMembership size={size} color={color} />;
    case 'id':
    default:
      return <EmblemID size={size} color={color} />;
  }
}

export function GuillochePattern({
  color = colors.brand.brass,
  opacity = 0.1,
  width = '100%',
  height = '100%',
}: {color?: string; opacity?: number; width?: number | string; height?: number | string}) {
  const angles = [0, 30, 60, 90, 120, 150];
  return (
    <Svg width={width} height={height} viewBox="0 0 300 180" preserveAspectRatio="xMidYMid slice" style={{opacity}}>
      <Defs>
        <Pattern id="guilloche" x={0} y={0} width={60} height={60} patternUnits="userSpaceOnUse">
          {angles.map(a => (
            <Ellipse
              key={a}
              cx={30}
              cy={30}
              rx={28}
              ry={10}
              fill="none"
              stroke={color}
              strokeWidth={0.4}
              transform={`rotate(${a} 30 30)`}
            />
          ))}
        </Pattern>
      </Defs>
      <Rect width={300} height={180} fill="url(#guilloche)" />
    </Svg>
  );
}

export function CardGradient({
  start,
  end,
  width = '100%',
  height = '100%',
}: {start: string; end: string; width?: number | string; height?: number | string}) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={start} />
          <Stop offset="1" stopColor={end} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#cardGrad)" />
    </Svg>
  );
}

export function HolographicStripe({
  width = 12,
  height = '100%',
  color = colors.brand.brass,
}: {width?: number; height?: number | string; color?: string}) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="holo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.3" stopColor={color} stopOpacity={0.5} />
          <Stop offset="0.5" stopColor="#B4E6C8" stopOpacity={0.4} />
          <Stop offset="0.7" stopColor={color} stopOpacity={0.5} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#holo)" />
    </Svg>
  );
}

export function MicrotextBorder({
  color = colors.brand.brass,
  width,
  height,
}: {color?: string; width: number; height: number}) {
  return (
    <Svg
      width={width - 12}
      height={height - 12}
      style={{position: 'absolute', top: 6, left: 6, opacity: 0.5}}
      pointerEvents="none">
      <Rect
        x={0.25}
        y={0.25}
        width={width - 12.5}
        height={height - 12.5}
        rx={16}
        ry={16}
        stroke={color}
        strokeWidth={0.5}
        fill="none"
      />
    </Svg>
  );
}
