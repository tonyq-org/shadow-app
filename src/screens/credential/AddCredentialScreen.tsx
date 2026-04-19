import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<CredentialStackParamList, 'AddCredential'>;

export default function AddCredentialScreen({navigation}: Props) {
  const {t} = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('credential.add')}</Text>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate('ScanQR')}>
        <Text style={styles.optionIcon}>📷</Text>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{t('credential.scanQR')}</Text>
          <Text style={styles.optionDesc}>掃描 QR Code 新增憑證</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate('SearchCredential')}>
        <Text style={styles.optionIcon}>🔍</Text>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{t('credential.search')}</Text>
          <Text style={styles.optionDesc}>搜尋可用的數位憑證</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg, padding: 24},
  title: {fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 24},
  option: {
    flexDirection: 'row',
    backgroundColor: colors.surface.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.line,
  },
  optionIcon: {fontSize: 32, marginRight: 16},
  optionContent: {flex: 1},
  optionTitle: {fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 4},
  optionDesc: {fontSize: 13, color: colors.text.dim},
});
