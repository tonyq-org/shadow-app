import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';
import {BiometryErrorCode, mapBiometryError, type BiometryError} from './BiometricErrors';

const rnBiometrics = new ReactNativeBiometrics({allowDeviceCredentials: true});

export type BiometricResult =
  | {success: true}
  | {success: false; error: BiometryError};

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const {available, biometryType} = await rnBiometrics.isSensorAvailable();
    return available && biometryType !== undefined;
  } catch {
    return false;
  }
}

export async function getBiometryType(): Promise<string | null> {
  try {
    const {biometryType} = await rnBiometrics.isSensorAvailable();
    switch (biometryType) {
      case BiometryTypes.TouchID:
        return 'TouchID';
      case BiometryTypes.FaceID:
        return 'FaceID';
      case BiometryTypes.Biometrics:
        return 'Biometrics';
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export async function authenticateWithBiometric(
  promptMessage: string,
  cancelButtonText = '取消',
): Promise<BiometricResult> {
  try {
    const {success, error} = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText,
    });
    if (success) {
      return {success: true};
    }
    return {
      success: false,
      error: mapBiometryError(error ?? 'UserCancel'),
    };
  } catch (e) {
    return {success: false, error: mapBiometryError(e)};
  }
}

export {BiometryErrorCode};
