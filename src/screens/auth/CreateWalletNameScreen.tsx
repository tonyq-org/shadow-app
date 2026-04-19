import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {AuthStackParamList} from '../../navigation/types';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateWalletName'>;

export default function CreateWalletNameScreen({navigation}: Props) {
  const {t} = useTranslation();
  const [name, setName] = useState('');

  const isValid = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.createWallet')}</Text>
        <Text style={styles.label}>{t('auth.walletName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.walletNamePlaceholder')}
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          maxLength={30}
          autoFocus
        />
        <Text style={styles.counter}>{name.length}/30</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={() => navigation.navigate('CreatePinCode', {walletName: name.trim()})}
        disabled={!isValid}>
        <Text style={styles.buttonText}>{t('common.next')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.surface,
    padding: 24,
  },
  content: {
    flex: 1,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surface.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
  },
  counter: {
    fontSize: 12,
    color: colors.text.mute,
    textAlign: 'right',
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.brand.brass,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
