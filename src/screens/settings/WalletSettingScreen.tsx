import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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
import {colors, type as fonts} from '../../theme/tokens';
import {IconChevron, IconShield, IconFingerprint} from '../../components/icons';

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
      const matches = await verifyPinAsync(pin, currentWallet.pinSalt, currentWallet.pinHash);
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

  if (askingPin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => setAskingPin(false)}>
            <IconChevron size={18} color={colors.text.primary} direction="left" />
          </TouchableOpacity>
        </View>
        <View style={styles.pinContent}>
          <Text style={styles.microLabel}>VERIFY · PIN</Text>
          <Text style={styles.title}>
            請輸入 PIN 碼{'\n'}以啟用生物辨識
          </Text>
          <View style={{height: 32}} />
          <PinCodeInput length={6} onComplete={handlePinVerified} />
        </View>
        <LoadingOverlay visible={verifying} message={t('auth.verifyingPin')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <IconChevron size={18} color={colors.text.primary} direction="left" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.walletSettings')}</Text>
        <View style={{width: 38}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.microLabel}>WALLET · PROFILE</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.iconTile}>
              <IconShield size={14} color={colors.text.dim} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.changeWalletName')}</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {currentWallet?.name ?? '—'}
            </Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.iconTile}>
              <IconShield size={14} color={colors.text.dim} />
            </View>
            <Text style={styles.rowLabel}>{t('settings.autoLogout')}</Text>
            <Text style={styles.rowValue}>
              {t('settings.autoLogoutMinutes', {minutes: currentWallet?.autoLogoutMinutes ?? 5})}
            </Text>
          </View>
        </View>

        {bioSupported ? (
          <>
            <Text style={styles.microLabel}>SECURITY</Text>
            <View style={styles.group}>
              <View style={styles.row}>
                <View style={styles.iconTile}>
                  <IconFingerprint size={14} color={colors.text.dim} />
                </View>
                <Text style={styles.rowLabel}>{t('settings.biometricLogin')}</Text>
                <Switch
                  value={currentWallet?.biometricEnabled ?? false}
                  onValueChange={handleToggleBiometric}
                  trackColor={{true: colors.brand.brass, false: 'rgba(246,241,227,0.15)'}}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </>
        ) : null}

        <Text style={styles.microLabel}>DANGER · ZONE</Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          activeOpacity={0.7}
          onPress={() => setShowDeleteAlert(true)}>
          <Text style={styles.deleteText}>{t('settings.deleteWallet')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={showDeleteAlert}
        title={t('settings.deleteWallet')}
        message={t('settings.deleteWalletConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteAlert(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.serifTC,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scroll: {paddingHorizontal: 24, paddingBottom: 80},
  microLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 4,
  },
  group: {
    borderRadius: 18,
    backgroundColor: colors.surface.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface.line,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: 'rgba(246,241,227,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
  },
  rowValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.text.dim,
    maxWidth: 160,
    textAlign: 'right',
  },
  deleteBtn: {
    marginTop: 4,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232,138,138,0.25)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.status.danger,
    letterSpacing: 0.5,
  },
  pinContent: {flex: 1, paddingHorizontal: 28, paddingTop: 20},
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 28,
    lineHeight: 38,
    color: colors.text.primary,
    fontWeight: '700',
  },
});
