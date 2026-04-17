import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({value, onChangeText, placeholder}: Props) {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('common.search')}
        placeholderTextColor="#9CA3AF"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
});
