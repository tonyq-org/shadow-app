import {KeyManager} from '../../native/KeyManager';
import type {JWK} from './jwt';

export async function generateKeyPair(keyTag: string): Promise<JWK> {
  const jwkString = await KeyManager.generateP256Key(keyTag);
  return JSON.parse(jwkString);
}

export async function sign(
  keyTag: string,
  header: string,
  payload: string,
): Promise<string> {
  return KeyManager.sign(keyTag, header, payload);
}

export async function deleteKey(keyTag: string): Promise<boolean> {
  return KeyManager.deleteKey(keyTag);
}

export async function verifyKeyOwnership(
  keyTag: string,
  publicKey: string,
): Promise<boolean> {
  return KeyManager.verifyUser(keyTag, publicKey);
}
