import {NativeModules} from 'react-native';

interface KeyManagerInterface {
  generateP256Key(keyTag: string): Promise<string>;
  sign(keyTag: string, header: string, payload: string): Promise<string>;
  deleteKey(keyTag: string): Promise<boolean>;
  verifyUser(keyTag: string, publicKey: string): Promise<boolean>;
  pbkdf2(
    password: string,
    saltHex: string,
    iterations: number,
    keyLenBytes: number,
  ): Promise<string>;
}

const {KeyManagerModule} = NativeModules;

if (!KeyManagerModule) {
  throw new Error(
    'KeyManagerModule native module is not linked. Rebuild the app.',
  );
}

export const KeyManager: KeyManagerInterface = KeyManagerModule;
