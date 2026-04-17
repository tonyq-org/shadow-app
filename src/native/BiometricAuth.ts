import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({allowDeviceCredentials: true});

export interface BiometricResult {
  success: boolean;
  error?: string;
}

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
): Promise<BiometricResult> {
  try {
    const {success, error} = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: '取消',
    });
    if (success) {
      return {success: true};
    }
    return {success: false, error: error ?? 'Authentication cancelled'};
  } catch (e: any) {
    return {success: false, error: e.message ?? String(e)};
  }
}
