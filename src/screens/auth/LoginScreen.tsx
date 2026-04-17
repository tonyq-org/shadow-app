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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {wallets} = useWallet();
  const login = useAuthStore(s => s.login);
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);

  const selectedWallet = wallets[selectedWalletIndex];

  const handlePinComplete = (value: string) => {
    if (!selectedWallet) {
      return;
    }

    // TODO: use proper hash comparison
    if (value === selectedWallet.pinHash) {
      login(selectedWallet.id);
    } else {
      Alert.alert(t('auth.loginFailed'), t('auth.wrongPinCode'));
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
        <PinCodeInput length={6} onComplete={handlePinComplete} />
      </View>
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
  walletName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 8,
  },
  switchButton: {
    marginBottom: 32,
  },
  switchText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
});
