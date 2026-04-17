import React, {useState, useRef} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

interface Props {
  length: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
}

export default function PinCodeInput({length, onComplete, disabled}: Props) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    setPin(cleaned);
    if (cleaned.length === length) {
      onComplete(cleaned);
      setTimeout(() => setPin(''), 300);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({length}).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length && styles.dotFilled]}
          />
        ))}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={pin}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        editable={!disabled}
        secureTextEntry
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 50,
  },
});
