import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {useTranslation} from 'react-i18next';
import {enableBiometricUnlock, disableBiometricUnlock} from '../native/BiometricUnlock';
import * as walletDao from '../db/walletDao';
import {useWalletStore, type Wallet} from '../store/walletStore';

interface BiometricToggleState {
  askingPin: boolean;
  toggle: (value: boolean) => void;
  onPinVerified: () => Promise<void>;
  cancelPinPrompt: () => void;
}

export function useBiometricToggle(wallet: Wallet | null | undefined): BiometricToggleState {
  const {t} = useTranslation();
  const updateWallet = useWalletStore(s => s.updateWallet);
  const [askingPin, setAskingPin] = useState(false);

  const toggle = useCallback(
    async (value: boolean) => {
      if (!wallet) return;
      if (value) {
        setAskingPin(true);
      } else {
        await disableBiometricUnlock(wallet.id);
        walletDao.updateBiometricEnabled(wallet.id, false);
        updateWallet(wallet.id, {biometricEnabled: false});
      }
    },
    [wallet, updateWallet],
  );

  const onPinVerified = useCallback(async () => {
    if (!wallet) {
      setAskingPin(false);
      return;
    }
    const ok = await enableBiometricUnlock(wallet.id);
    if (ok) {
      walletDao.updateBiometricEnabled(wallet.id, true);
      updateWallet(wallet.id, {biometricEnabled: true});
    } else {
      Alert.alert(t('common.error'), t('auth.biometricEnableFailed'));
    }
    setAskingPin(false);
  }, [wallet, updateWallet, t]);

  const cancelPinPrompt = useCallback(() => setAskingPin(false), []);

  return {askingPin, toggle, onPinVerified, cancelPinPrompt};
}
