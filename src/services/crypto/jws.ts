import {base64urlEncode} from '../../utils/base64url';
import type {JWTHeader, JWTPayload} from './jwt';
import {KeyManager} from '../../native/KeyManager';

export async function createSignedJWT(
  keyTag: string,
  header: JWTHeader,
  payload: JWTPayload,
): Promise<string> {
  const headerStr = JSON.stringify(header);
  const payloadStr = JSON.stringify(payload);
  const jws = await KeyManager.sign(keyTag, headerStr, payloadStr);
  return jws;
}

export function createUnsignedJWT(
  header: JWTHeader,
  payload: JWTPayload,
): string {
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  return `${headerB64}.${payloadB64}`;
}
