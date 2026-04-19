import * as Keychain from 'react-native-keychain';
import {BiometryErrorCode, mapBiometryError, type BiometryError} from './BiometricErrors';

function service(walletId: string): string {
  return `shadow-wallet-biometric-${walletId}`;
}

interface RandomSource {
  getRandomValues(arr: Uint8Array): Uint8Array;
}

function generateToken(): string {
  const bytes = new Uint8Array(16);
  const source = (globalThis as unknown as {crypto: RandomSource}).crypto;
  source.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function enableBiometricUnlock(walletId: string): Promise<boolean> {
  try {
    const token = generateToken();
    await Keychain.setGenericPassword('bio', token, {
      service: service(walletId),
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
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

export type VerifyResult =
  | {success: true}
  | {success: false; error: BiometryError};

export async function verifyBiometric(
  walletId: string,
  promptMessage: string,
): Promise<VerifyResult> {
  try {
    const result = await Keychain.getGenericPassword({
      service: service(walletId),
      authenticationPrompt: {title: promptMessage},
    });
    if (result && result.password) {
      return {success: true};
    }
    return {
      success: false,
      error: {code: BiometryErrorCode.NotAvailable, message: 'No credential stored'},
    };
  } catch (e) {
    return {success: false, error: mapBiometryError(e)};
  }
}
