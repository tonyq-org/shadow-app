import {NativeModules, Platform} from 'react-native';

interface KeyManagerInterface {
  generateP256Key(keyTag: string): Promise<string>;
  sign(keyTag: string, header: string, payload: string): Promise<string>;
  deleteKey(keyTag: string): Promise<boolean>;
  verifyUser(keyTag: string, publicKey: string): Promise<boolean>;
}

const {KeyManagerModule} = NativeModules;

if (!KeyManagerModule) {
  console.warn(
    `KeyManagerModule is not available. Platform: ${Platform.OS}. ` +
    'Make sure the native module is properly linked.',
  );
}

export const KeyManager: KeyManagerInterface = KeyManagerModule ?? {
  async generateP256Key(_keyTag: string) {
    throw new Error('KeyManagerModule not available');
  },
  async sign(_keyTag: string, _header: string, _payload: string) {
    throw new Error('KeyManagerModule not available');
  },
  async deleteKey(_keyTag: string) {
    throw new Error('KeyManagerModule not available');
  },
  async verifyUser(_keyTag: string, _publicKey: string) {
    throw new Error('KeyManagerModule not available');
  },
};
