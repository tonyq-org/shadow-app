// Biometric authentication wrapper
// Uses react-native-biometrics when installed
// TODO: npm install react-native-biometrics

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export async function isBiometricAvailable(): Promise<boolean> {
  // TODO: implement with react-native-biometrics
  return false;
}

export async function authenticateWithBiometric(
  promptMessage: string,
): Promise<BiometricResult> {
  // TODO: implement with react-native-biometrics
  return {success: false, error: 'Not implemented'};
}
