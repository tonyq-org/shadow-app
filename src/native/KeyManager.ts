import {NativeModules, Platform} from 'react-native';

interface KeyManagerInterface {
  generateP256Key(keyTag: string): Promise<string>;
  sign(keyTag: string, header: string, payload: string): Promise<string>;
  deleteKey(keyTag: string): Promise<boolean>;
  verifyUser(keyTag: string, publicKey: string): Promise<boolean>;
}

const {KeyManagerModule} = NativeModules;

// In-memory key store for development
const mockKeys: Record<string, {x: string; y: string}> = {};

function randomBase64url(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

declare function btoa(data: string): string;

const mockKeyManager: KeyManagerInterface = {
  async generateP256Key(keyTag: string) {
    const key = {x: randomBase64url(43), y: randomBase64url(43)};
    mockKeys[keyTag] = key;
    return JSON.stringify({kty: 'EC', crv: 'P-256', x: key.x, y: key.y});
  },

  async sign(_keyTag: string, header: string, payload: string) {
    const headerB64 = btoa(header).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const mockSig = randomBase64url(86);
    return `${headerB64}.${payloadB64}.${mockSig}`;
  },

  async deleteKey(keyTag: string) {
    delete mockKeys[keyTag];
    return true;
  },

  async verifyUser(keyTag: string, publicKey: string) {
    const stored = mockKeys[keyTag];
    if (!stored) {
      return false;
    }
    try {
      const parsed = JSON.parse(publicKey);
      return parsed.x === stored.x && parsed.y === stored.y;
    } catch {
      return false;
    }
  },
};

export const KeyManager: KeyManagerInterface = KeyManagerModule ?? mockKeyManager;
