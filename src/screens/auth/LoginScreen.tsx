import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {AuthStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useAuthStore} from '../../store/authStore';
import PinCodeInput from '../../components/PinCodeInput';
import LoadingOverlay from '../../components/LoadingOverlay';
import {verifyPinAsync} from '../../utils/pin';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
} from '../../native/BiometricAuth';
import {getPinViaBiometric} from '../../native/BiometricUnlock';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {wallets} = useWallet();
  const login = useAuthStore(s => s.login);
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
  const [biometricReady, setBiometricReady] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const selectedWallet = wallets[selectedWalletIndex];

  useEffect(() => {
    if (!selectedWallet) {
      return;
    }
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricReady(available && selectedWallet.biometricEnabled);
    })();
  }, [selectedWallet]);

  const handleBiometric = async () => {
    if (!selectedWallet) {
      return;
    }
    const pin = await getPinViaBiometric(
      selectedWallet.id,
      t('auth.useBiometric'),
    );
    if (!pin) {
      return;
    }
    setVerifying(true);
    try {
      const ok = await verifyPinAsync(
        pin,
        selectedWallet.pinSalt,
        selectedWallet.pinHash,
      );
      if (ok) {
        login(selectedWallet.id);
      } else {
        Alert.alert(t('auth.loginFailed'), t('auth.wrongPinCode'));
      }
    } finally {
      setVerifying(false);
    }
  };

  const handlePinComplete = async (value: string) => {
    if (!selectedWallet) {
      return;
    }
    setVerifying(true);
    try {
      const ok = await verifyPinAsync(
        value,
        selectedWallet.pinSalt,
        selectedWallet.pinHash,
      );
      if (ok) {
        login(selectedWallet.id);
      } else {
        Alert.alert(t('auth.loginFailed'), t('auth.wrongPinCode'));
      }
    } finally {
      setVerifying(false);
    }
  };

  if (!selectedWallet) {
    navigation.replace('Welcome');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.login')}</Text>
        <Text style={styles.walletName}>{selectedWallet.name}</Text>

        {wallets.length > 1 && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() =>
              setSelectedWalletIndex((selectedWalletIndex + 1) % wallets.length)
            }>
            <Text style={styles.switchText}>切換皮夾</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.subtitle}>{t('auth.enterPinCode')}</Text>
        <PinCodeInput length={6} onComplete={handlePinComplete} disabled={verifying} />

        {biometricReady && (
          <TouchableOpacity style={styles.bioButton} onPress={handleBiometric}>
            <Text style={styles.bioText}>{t('auth.useBiometric')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <LoadingOverlay visible={verifying} message={t('auth.verifyingPin')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF', padding: 24},
  content: {flex: 1, paddingTop: 80, alignItems: 'center'},
  title: {fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 8},
  walletName: {fontSize: 18, fontWeight: '600', color: '#2563EB', marginBottom: 8},
  switchButton: {marginBottom: 32},
  switchText: {fontSize: 14, color: '#6B7280', textDecorationLine: 'underline'},
  subtitle: {fontSize: 14, color: '#6B7280', marginBottom: 32},
  bioButton: {marginTop: 32, padding: 12},
  bioText: {fontSize: 15, color: '#2563EB', fontWeight: '600'},
});
