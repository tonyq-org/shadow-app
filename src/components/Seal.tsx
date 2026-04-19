import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Circle, Defs, RadialGradient, Stop, Rect} from 'react-native-svg';
import {colors} from '../theme/tokens';
import {IconShield} from './icons';

interface Props {
  size?: number;
}

export default function Seal({size = 110}: Props) {
  const center = size / 2;
  return (
    <View style={[styles.wrap, {width: size, height: size}]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="sealGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.brand.brass} stopOpacity={0.22} />
            <Stop offset="70%" stopColor={colors.brand.brass} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} fill="url(#sealGlow)" />
        <Circle
          cx={center}
          cy={center}
          r={center - 2}
          stroke={colors.brand.brass66}
          strokeWidth={0.5}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={center - 10}
          stroke={colors.brand.brass55}
          strokeWidth={0.5}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={center - 22}
          stroke="rgba(232,201,122,0.3)"
          strokeWidth={0.5}
          fill="none"
        />
      </Svg>
      <View style={[styles.iconSlot, {width: size, height: size}]} pointerEvents="none">
        <IconShield size={Math.round(size * 0.44)} color={colors.brand.brass} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'center'},
  iconSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
