import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {AuthStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useAuthStore} from '../../store/authStore';
import {useWalletStore} from '../../store/walletStore';
import PinCodeInput from '../../components/PinCodeInput';
import LoadingOverlay from '../../components/LoadingOverlay';
import {verifyPinAsync} from '../../utils/pin';
import {computePinGate} from '../../utils/pinGate';
import {isBiometricAvailable} from '../../native/BiometricAuth';
import {
  verifyBiometric,
  disableBiometricUnlock,
  enableBiometricUnlock,
} from '../../native/BiometricUnlock';
import {BiometryErrorCode} from '../../native/BiometricErrors';
import * as walletDao from '../../db/walletDao';
import {addOperationRecord} from '../../db/recordDao';
import {colors, type as fonts} from '../../theme/tokens';
import {IconFingerprint} from '../../components/icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {wallets} = useWallet();
  const login = useAuthStore(s => s.login);
  const updateWallet = useWalletStore(s => s.updateWallet);
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
  const [biometricReady, setBiometricReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const autoTriggeredRef = useRef<string | null>(null);
  const reEnableAfterPinRef = useRef<boolean>(false);

  const selectedWallet = wallets[selectedWalletIndex];

  const handleBiometric = useCallback(async () => {
    if (!selectedWallet) return;
    const result = await verifyBiometric(selectedWallet.id, t('auth.biometricPrompt'));
    if (result.success) {
      addOperationRecord(selectedWallet.id, 'login', 'success:biometric');
      login(selectedWallet.id);
      return;
    }
    const {code} = result.error;
    if (code === BiometryErrorCode.UserCancel) {
      return;
    }
    if (code === BiometryErrorCode.KeyInvalidated) {
      await disableBiometricUnlock(selectedWallet.id);
      walletDao.updateBiometricEnabled(selectedWallet.id, false);
      updateWallet(selectedWallet.id, {biometricEnabled: false});
      setBiometricReady(false);
      reEnableAfterPinRef.current = true;
      Alert.alert(t('auth.biometricChangedTitle'), t('auth.biometricChangedBody'));
      return;
    }
    if (code === BiometryErrorCode.Lockout) {
      Alert.alert(t('common.error'), t('auth.biometricLocked'));
      return;
    }
    if (code === BiometryErrorCode.LockoutPermanent) {
      Alert.alert(t('common.error'), t('auth.biometricLockedPermanent'));
      return;
    }
    if (code === BiometryErrorCode.NotAvailable) {
      Alert.alert(t('common.error'), t('auth.biometricUnavailable'));
    }
  }, [selectedWallet, login, updateWallet, t]);

  useFocusEffect(
    useCallback(() => {
      if (!selectedWallet) return;
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      (async () => {
        const available = await isBiometricAvailable();
        if (cancelled) return;
        const ready = available && selectedWallet.biometricEnabled;
        setBiometricReady(ready);
        if (ready && autoTriggeredRef.current !== selectedWallet.id) {
          autoTriggeredRef.current = selectedWallet.id;
          timer = setTimeout(() => {
            if (!cancelled) handleBiometric();
          }, 350);
        }
      })();
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }, [selectedWallet, handleBiometric]),
  );

  const handlePinComplete = async (value: string) => {
    if (!selectedWallet) return;
    const gate = computePinGate(
      selectedWallet.pinFailureCount,
      selectedWallet.pinFailureAt,
    );
    if (!gate.allowed) {
      Alert.alert(
        t('auth.pinLockedTitle'),
        t('auth.pinLockedBody', {seconds: gate.remainingSeconds}),
      );
      return;
    }
    setVerifying(true);
    try {
      const ok = await verifyPinAsync(value, selectedWallet.pinSalt, selectedWallet.pinHash);
      if (ok) {
        walletDao.resetPinFailures(selectedWallet.id);
        updateWallet(selectedWallet.id, {pinFailureCount: 0, pinFailureAt: 0});
        addOperationRecord(selectedWallet.id, 'login', 'success:pin');
        if (reEnableAfterPinRef.current) {
          reEnableAfterPinRef.current = false;
          const enabled = await enableBiometricUnlock(selectedWallet.id);
          if (enabled) {
            walletDao.updateBiometricEnabled(selectedWallet.id, true);
            updateWallet(selectedWallet.id, {biometricEnabled: true});
          }
        }
        login(selectedWallet.id);
      } else {
        const next = walletDao.recordPinFailure(selectedWallet.id);
        updateWallet(selectedWallet.id, {
          pinFailureCount: next.count,
          pinFailureAt: next.at,
        });
        addOperationRecord(selectedWallet.id, 'login', `failed:pin:${next.count}`);
        const after = computePinGate(next.count, next.at);
        if (!after.allowed) {
          Alert.alert(
            t('auth.pinLockedTitle'),
            t('auth.pinLockedBody', {seconds: after.remainingSeconds}),
          );
        } else {
          Alert.alert(t('auth.loginFailed'), t('auth.wrongPinCode'));
        }
      }
    } finally {
      setVerifying(false);
    }
  };

  if (!selectedWallet) {
    navigation.replace('Welcome');
    return null;
  }

  const initial = selectedWallet.name.slice(0, 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepLabel}>UNLOCK · WALLET</Text>
        <Text style={styles.title}>
          {t('auth.welcomeBack')}{'\n'}
          <Text style={styles.titleDim}>{selectedWallet.name}</Text>
        </Text>
        <Text style={styles.body}>{t('auth.unlockHint')}</Text>

        <View style={styles.walletCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.walletLabel}>MAIN · WALLET</Text>
            <Text style={styles.walletName}>{selectedWallet.name}</Text>
          </View>
          {wallets.length > 1 ? (
            <TouchableOpacity
              onPress={() => setSelectedWalletIndex((selectedWalletIndex + 1) % wallets.length)}
              activeOpacity={0.6}>
              <Text style={styles.switchLink}>{t('auth.switchWallet')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.pinSlot}>
          <PinCodeInput length={6} onComplete={handlePinComplete} disabled={verifying} />
        </View>

        {biometricReady ? (
          <TouchableOpacity
            style={styles.bioBtn}
            activeOpacity={0.7}
            onPress={handleBiometric}>
            <IconFingerprint size={18} color={colors.brand.brass} />
            <Text style={styles.bioText}>{t('auth.useBiometric')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <LoadingOverlay visible={verifying} message={t('auth.verifyingPin')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  content: {flex: 1, paddingHorizontal: 28, paddingTop: 40},
  stepLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 30,
    lineHeight: 40,
    color: colors.text.primary,
    fontWeight: '700',
  },
  titleDim: {color: colors.text.dim, fontSize: 20},
  body: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 22,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: colors.surface.surface,
    marginBottom: 28,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brand.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.serifTC,
    fontSize: 20,
    color: colors.brand.ink,
    fontWeight: '700',
  },
  walletLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 2,
  },
  walletName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  switchLink: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.brand.brass,
  },
  pinSlot: {flex: 1},
  bioBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand.brass66,
    backgroundColor: colors.brand.brass15,
    marginBottom: 20,
  },
  bioText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.brand.brass,
    letterSpacing: 0.3,
  },
});
