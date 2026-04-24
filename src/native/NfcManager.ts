// NFC communication wrapper for VP transmission
// Uses react-native-nfc-manager when installed
// TODO: npm install react-native-nfc-manager

export interface NfcResult {
  success: boolean;
  data?: string;
  error?: string;
}

export async function isNfcAvailable(): Promise<boolean> {
  // TODO: implement with react-native-nfc-manager
  return false;
}

export async function sendViaNfc(_data: Uint8Array): Promise<NfcResult> {
  // TODO: implement ISO-DEP NFC transmission
  // Chunk data into 255-byte packets
  // Use SELECT_APDU: 00 A4 04 00 06 F2 23 34 45 56 68
  return {success: false, error: 'Not implemented'};
}

export async function receiveViaNfc(): Promise<NfcResult> {
  // TODO: implement NFC receive
  return {success: false, error: 'Not implemented'};
}
