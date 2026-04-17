import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {SettingsStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useAuthStore} from '../../store/authStore';
import {useWalletStore} from '../../store/walletStore';
import CustomAlert from '../../components/CustomAlert';
import {isBiometricAvailable} from '../../native/BiometricAuth';
import {
  enableBiometricUnlock,
  disableBiometricUnlock,
} from '../../native/BiometricUnlock';
import * as walletDao from '../../db/walletDao';
import PinCodeInput from '../../components/PinCodeInput';
import LoadingOverlay from '../../components/LoadingOverlay';
import {verifyPinAsync} from '../../utils/pin';

type Props = NativeStackScreenProps<SettingsStackParamList, 'WalletSetting'>;

export default function WalletSettingScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {currentWallet} = useWallet();
  const updateWallet = useWalletStore(s => s.updateWallet);
  const logout = useAuthStore(s => s.logout);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [askingPin, setAskingPin] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBioSupported);
  }, []);

  const handleDelete = async () => {
    if (!currentWallet) {
      logout();
      return;
    }
    try {
      await disableBiometricUnlock(currentWallet.id);
    } catch {}
    walletDao.deleteWallet(currentWallet.id);
    useWalletStore.getState().removeWallet(currentWallet.id);
    logout();
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (!currentWallet) return;
    if (value) {
      setAskingPin(true);
    } else {
      await disableBiometricUnlock(currentWallet.id);
      walletDao.updateBiometricEnabled(currentWallet.id, false);
      updateWallet(currentWallet.id, {biometricEnabled: false});
    }
  };

  const handlePinVerified = async (pin: string) => {
    if (!currentWallet) return;
    setVerifying(true);
    try {
      const matches = await verifyPinAsync(
        pin,
        currentWallet.pinSalt,
        currentWallet.pinHash,
      );
      if (!matches) {
        Alert.alert(t('auth.loginFailed'), t('auth.wrongPinCode'));
        setAskingPin(false);
        return;
      }
      const ok = await enableBiometricUnlock(currentWallet.id, pin);
      if (ok) {
        walletDao.updateBiometricEnabled(currentWallet.id, true);
        updateWallet(currentWallet.id, {biometricEnabled: true});
      } else {
        Alert.alert(t('common.error'), '啟用生物辨識失敗');
      }
      setAskingPin(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.walletSettings')}</Text>
      </View>

      {askingPin ? (
        <View style={styles.pinContainer}>
          <Text style={styles.pinPrompt}>{t('auth.enterPinCode')}</Text>
          <PinCodeInput length={6} onComplete={handlePinVerified} />
          <TouchableOpacity onPress={() => setAskingPin(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('settings.changeWalletName')}</Text>
            <Text style={styles.menuValue}>{currentWallet?.name ?? '-'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('settings.autoLogout')}</Text>
            <Text style={styles.menuValue}>
              {t('settings.autoLogoutMinutes', {minutes: currentWallet?.autoLogoutMinutes ?? 5})}
            </Text>
          </TouchableOpacity>

          {bioSupported && (
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>{t('settings.biometricLogin')}</Text>
              <Switch
                value={currentWallet?.biometricEnabled ?? false}
                onValueChange={handleToggleBiometric}
              />
            </View>
          )}

          <View style={{flex: 1}} />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteAlert(true)}>
            <Text style={styles.deleteText}>{t('settings.deleteWallet')}</Text>
          </TouchableOpacity>
        </>
      )}

      <CustomAlert
        visible={showDeleteAlert}
        title={t('settings.deleteWallet')}
        message={t('settings.deleteWalletConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteAlert(false)}
        destructive
      />
      <LoadingOverlay visible={verifying} message={t('auth.verifyingPin')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF'},
  backButton: {fontSize: 16, color: '#2563EB', marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#1F2937'},
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {fontSize: 16, color: '#1F2937'},
  menuValue: {fontSize: 14, color: '#6B7280'},
  deleteButton: {
    margin: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  deleteText: {fontSize: 16, fontWeight: '600', color: '#DC2626'},
  pinContainer: {flex: 1, padding: 32, alignItems: 'center'},
  pinPrompt: {fontSize: 16, color: '#1F2937', marginBottom: 32},
  cancelBtn: {marginTop: 24},
  cancelText: {fontSize: 14, color: '#6B7280'},
});
