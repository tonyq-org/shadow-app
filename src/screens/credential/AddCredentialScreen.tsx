import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, SafeAreaView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';

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
  container: {flex: 1, backgroundColor: '#F9FAFB', padding: 24},
  title: {fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 24},
  option: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {fontSize: 32, marginRight: 16},
  optionContent: {flex: 1},
  optionTitle: {fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4},
  optionDesc: {fontSize: 13, color: '#6B7280'},
});
