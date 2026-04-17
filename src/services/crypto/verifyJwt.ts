import {p256} from '@noble/curves/nist.js';
import {base64urlDecodeBytes} from '../../utils/base64url';
import type {JWK} from './jwt';

function utf8ToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length * 4);
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes[len++] = c;
    } else if (c < 0x800) {
      bytes[len++] = 0xc0 | (c >> 6);
      bytes[len++] = 0x80 | (c & 0x3f);
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const c2 = str.charCodeAt(++i);
      c = 0x10000 + (((c & 0x3ff) << 10) | (c2 & 0x3ff));
      bytes[len++] = 0xf0 | (c >> 18);
      bytes[len++] = 0x80 | ((c >> 12) & 0x3f);
      bytes[len++] = 0x80 | ((c >> 6) & 0x3f);
      bytes[len++] = 0x80 | (c & 0x3f);
    } else {
      bytes[len++] = 0xe0 | (c >> 12);
      bytes[len++] = 0x80 | ((c >> 6) & 0x3f);
      bytes[len++] = 0x80 | (c & 0x3f);
    }
  }
  return bytes.slice(0, len);
}

function jwkToUncompressedPublicKey(jwk: JWK): Uint8Array {
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') {
    throw new Error(`Unsupported JWK: kty=${jwk.kty} crv=${jwk.crv}`);
  }
  const x = base64urlDecodeBytes(jwk.x);
  const y = base64urlDecodeBytes(jwk.y);
  if (x.length !== 32 || y.length !== 32) {
    throw new Error('Invalid P-256 JWK coordinates');
  }
  const out = new Uint8Array(65);
  out[0] = 0x04;
  out.set(x, 1);
  out.set(y, 33);
  return out;
}

export function verifyJwt(token: string, jwk: JWK): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    const signedData = utf8ToBytes(`${parts[0]}.${parts[1]}`);
    const signature = base64urlDecodeBytes(parts[2]);
    const publicKey = jwkToUncompressedPublicKey(jwk);
    return p256.verify(signature, signedData, publicKey, {lowS: false});
  } catch {
    return false;
  }
}
