import React from 'react';
import {Alert, SafeAreaView, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import QRScanner from '../../components/QRScanner';

type Props = NativeStackScreenProps<CredentialStackParamList, 'ScanQR'>;

export default function ScanQRScreen({navigation}: Props) {
  const {t} = useTranslation();

  const handleScan = (data: string) => {
    Alert.alert(
      t('credential.scanQR'),
      data,
      [{text: t('common.ok'), onPress: () => navigation.goBack()}],
      {cancelable: false},
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <QRScanner onScan={handleScan} onCancel={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000000'},
});
