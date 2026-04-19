import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import QRScanner from '../../components/QRScanner';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<PresentationStackParamList, 'PresentationHome'>;

export default function PresentationHomeScreen({navigation}: Props) {
  const {t} = useTranslation();
  const [scanning, setScanning] = useState(false);

  const handleScanned = (data: string) => {
    setScanning(false);
    navigation.navigate('VPAuthorization', {qrData: data});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📤</Text>
        <Text style={styles.title}>{t('presentation.title')}</Text>
        <Text style={styles.description}>{t('presentation.scanToPresent')}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => setScanning(true)}>
        <Text style={styles.buttonText}>{t('presentation.scanQR')}</Text>
      </TouchableOpacity>

      <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)}>
        <QRScanner
          active={scanning}
          onScan={handleScanned}
          onCancel={() => setScanning(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  content: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24},
  icon: {fontSize: 64, marginBottom: 24},
  title: {fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 8},
  description: {fontSize: 15, color: colors.text.dim, textAlign: 'center'},
  button: {backgroundColor: colors.brand.brass, borderRadius: 12, paddingVertical: 16, alignItems: 'center', margin: 24},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
