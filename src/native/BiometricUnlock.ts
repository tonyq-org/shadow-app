import * as Keychain from 'react-native-keychain';

function service(walletId: string): string {
  return `shadow-wallet-biometric-${walletId}`;
}

export async function enableBiometricUnlock(
  walletId: string,
  pin: string,
): Promise<boolean> {
  try {
    await Keychain.setGenericPassword('pin', pin, {
      service: service(walletId),
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    return false;
  }
}

export async function disableBiometricUnlock(walletId: string): Promise<void> {
  try {
    await Keychain.resetGenericPassword({service: service(walletId)});
  } catch {}
}

export async function getPinViaBiometric(
  walletId: string,
  promptMessage: string,
): Promise<string | null> {
  try {
    const result = await Keychain.getGenericPassword({
      service: service(walletId),
      authenticationPrompt: {title: promptMessage},
    });
    if (result && result.password) {
      return result.password;
    }
    return null;
  } catch {
    return null;
  }
}
