import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {SettingsStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useWalletStore} from '../../store/walletStore';
import PinCodeInput from '../../components/PinCodeInput';
import LoadingOverlay from '../../components/LoadingOverlay';
import {generateSalt, hashPinAsync, verifyPinAsync} from '../../utils/pin';
import * as walletDao from '../../db/walletDao';
import {colors, type as fonts} from '../../theme/tokens';
import {IconChevron} from '../../components/icons';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ChangePinCode'>;

type Step = 'verify' | 'set' | 'confirm';

export default function ChangePinCodeScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {currentWallet} = useWallet();
  const updateWallet = useWalletStore(s => s.updateWallet);

  const [step, setStep] = useState<Step>('verify');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentWallet) {
    navigation.goBack();
    return null;
  }

  const handlePinComplete = async (value: string) => {
    if (step === 'verify') {
      setLoading(true);
      try {
        const ok = await verifyPinAsync(
          value,
          currentWallet.pinSalt,
          currentWallet.pinHash,
        );
        if (!ok) {
          Alert.alert(t('common.error'), t('auth.wrongPinCode'));
          return;
        }
        setStep('set');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 'set') {
      setNewPin(value);
      setStep('confirm');
      return;
    }

    if (value !== newPin) {
      Alert.alert(t('common.error'), t('auth.pinCodeMismatch'));
      setStep('set');
      setNewPin('');
      return;
    }

    setLoading(true);
    try {
      const salt = generateSalt();
      const pinHash = await hashPinAsync(value, salt);
      walletDao.updatePin(currentWallet.id, pinHash, salt);
      updateWallet(currentWallet.id, {pinHash, pinSalt: salt});
      Alert.alert(t('common.success'), t('settings.changePinSuccess'), [
        {text: t('common.ok'), onPress: () => navigation.goBack()},
      ]);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '');
      setStep('set');
      setNewPin('');
    } finally {
      setLoading(false);
    }
  };

  const stepLabel =
    step === 'verify'
      ? 'STEP · 01 · OF · 03'
      : step === 'set'
      ? 'STEP · 02 · OF · 03'
      : 'STEP · 03 · OF · 03';
  const title =
    step === 'verify'
      ? t('settings.changePinVerifyTitle')
      : step === 'set'
      ? t('settings.changePinSetTitle')
      : t('settings.changePinConfirmTitle');
  const body =
    step === 'verify'
      ? t('settings.changePinVerifyBody')
      : step === 'set'
      ? t('settings.changePinSetBody')
      : t('settings.changePinConfirmBody');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <IconChevron size={18} color={colors.text.primary} direction="left" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <View style={styles.pinSlot}>
          <PinCodeInput length={6} onComplete={handlePinComplete} disabled={loading} />
        </View>
      </View>
      <LoadingOverlay visible={loading} message={t('auth.verifyingPin')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {paddingHorizontal: 16, paddingTop: 8},
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {flex: 1, paddingHorizontal: 28, paddingTop: 20},
  stepLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text.primary,
    fontWeight: '700',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    lineHeight: 20,
    marginTop: 14,
    marginBottom: 40,
  },
  pinSlot: {flex: 1},
});
