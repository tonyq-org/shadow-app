import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<CredentialStackParamList, 'ScanQR'>;

export default function ScanQRScreen({navigation}: Props) {
  const {t} = useTranslation();

  // TODO: integrate react-native-vision-camera for QR scanning

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('scan.title')}</Text>
      </View>

      <View style={styles.cameraPlaceholder}>
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>{t('scan.hint')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000000'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  backButton: {fontSize: 16, color: '#FFFFFF', marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#FFFFFF'},
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
