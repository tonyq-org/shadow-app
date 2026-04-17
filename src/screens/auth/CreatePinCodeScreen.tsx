import React, {useState} from 'react';
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
import {generateSalt, hashPinAsync} from '../../utils/pin';

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 'set' ? t('auth.setPinCode') : t('auth.confirmPinCode')}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'set'
            ? '設定 6 位數 PIN 碼來保護您的皮夾'
            : '再次輸入 PIN 碼以確認'}
        </Text>
        <PinCodeInput
          length={6}
          onComplete={handlePinComplete}
          disabled={loading}
        />
      </View>
      <LoadingOverlay visible={loading} message={t('auth.verifyingPin')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  content: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 48,
  },
});
