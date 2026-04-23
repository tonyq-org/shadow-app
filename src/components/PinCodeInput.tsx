import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, type as fonts} from '../theme/tokens';

interface Props {
  length: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
}

const KEYS: Array<{label: string; value: string; special?: 'back'}> = [
  {label: '1', value: '1'},
  {label: '2', value: '2'},
  {label: '3', value: '3'},
  {label: '4', value: '4'},
  {label: '5', value: '5'},
  {label: '6', value: '6'},
  {label: '7', value: '7'},
  {label: '8', value: '8'},
  {label: '9', value: '9'},
  {label: '', value: ''},
  {label: '0', value: '0'},
  {label: '⌫', value: '', special: 'back'},
];

export default function PinCodeInput({length, onComplete, disabled}: Props) {
  const [pin, setPin] = useState('');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (pin.length === length) {
      const snapshot = pin;
      onCompleteRef.current(snapshot);
      const t = setTimeout(() => setPin(''), 250);
      return () => clearTimeout(t);
    }
  }, [pin, length]);

  const press = (k: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (k.special === 'back') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (!k.value) return;
    setPin(p => (p.length >= length ? p : p + k.value));
  };

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({length}).map((_, i) => {
          const filled = i < pin.length;
          return (
            <View key={i} style={[styles.dotBox, filled && styles.dotBoxFilled]}>
              {filled ? <View style={styles.dotFill} /> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((k, i) => {
          const empty = !k.label;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={empty ? 1 : 0.6}
              style={[styles.key, empty && styles.keyEmpty]}
              onPress={() => press(k)}
              disabled={disabled || empty}>
              <Text style={[styles.keyText, k.special === 'back' && styles.keyBack]}>
                {k.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const DOT_W = 38;
const DOT_H = 46;

const styles = StyleSheet.create({
  container: {alignItems: 'center', alignSelf: 'stretch'},
  dotsRow: {flexDirection: 'row', gap: 12, marginBottom: 36},
  dotBox: {
    width: DOT_W,
    height: DOT_H,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246,241,227,0.02)',
  },
  dotBoxFilled: {
    borderColor: colors.brand.brass,
  },
  dotFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.brass,
    shadowColor: colors.brand.brass,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    alignSelf: 'stretch',
  },
  key: {
    width: '30%',
    height: 60,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: 'rgba(246,241,227,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  keyText: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text.primary,
  },
  keyBack: {
    fontFamily: fonts.mono,
    fontSize: 20,
    color: colors.text.dim,
  },
});
