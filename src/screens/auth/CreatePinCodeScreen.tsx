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
import type {AuthStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useAuthStore} from '../../store/authStore';
import PinCodeInput from '../../components/PinCodeInput';
import LoadingOverlay from '../../components/LoadingOverlay';
import {generateSalt, hashPinAsync} from '../../utils/pin';
import {colors, type as fonts} from '../../theme/tokens';
import {IconChevron} from '../../components/icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreatePinCode'>;

export default function CreatePinCodeScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {walletName} = route.params;
  const {createNewWallet} = useWallet();
  const login = useAuthStore(s => s.login);

  const [step, setStep] = useState<'set' | 'confirm'>('set');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinComplete = async (value: string) => {
    if (step === 'set') {
      setPin(value);
      setStep('confirm');
    } else {
      if (value !== pin) {
        Alert.alert(t('common.error'), t('auth.pinCodeMismatch'));
        setStep('set');
        setPin('');
        return;
      }

      setLoading(true);
      try {
        const salt = generateSalt();
        const pinHash = await hashPinAsync(value, salt);
        const wallet = await createNewWallet(walletName, pinHash, salt);
        login(wallet.id);
      } catch (error: any) {
        Alert.alert(t('common.error'), error.message);
        setStep('set');
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  const stepLabel = step === 'set' ? 'STEP · 02 · OF · 03' : 'STEP · 03 · OF · 03';
  const title = step === 'set' ? '設定您的\n六位數 PIN 碼' : '再次輸入\n以確認 PIN 碼';
  const body =
    step === 'set'
      ? 'PIN 碼將透過 PBKDF2 於硬體安全模組推導加密金鑰，永不離開本機。'
      : '請重複輸入剛才設定的 PIN 碼，以避免輸入錯誤。';

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
