import {base64urlDecodeBytes} from './base64url';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// TWDIW-specific prefix prepended to the JWK JSON bytes before base58btc.
// Matches APPSDK/lib/did_key_gen.dart `hexPrefix = "d1d603"`.
const TWDIW_DID_PREFIX = new Uint8Array([0xd1, 0xd6, 0x03]);

// W3C did:key multicodec varint for P-256 public key (0x1200).
const W3C_P256_PREFIX = new Uint8Array([0x80, 0x24]);

export function jwkToTwdiwMultibase(jwk: {x: string; y: string}): string {
  // TWDIW encodes the literal JWK JSON string (not the raw key bytes) and
  // requires a fixed field order: kty, crv, x, y.
  const canonical = `{"kty":"EC","crv":"P-256","x":"${jwk.x}","y":"${jwk.y}"}`;
  const combined = new Uint8Array(TWDIW_DID_PREFIX.length + canonical.length);
  combined.set(TWDIW_DID_PREFIX);
  for (let i = 0; i < canonical.length; i++) {
    combined[TWDIW_DID_PREFIX.length + i] = canonical.charCodeAt(i);
  }
  return 'z' + base58Encode(combined);
}

export function jwkToW3cMultibase(jwk: {x: string; y: string}): string {
  const x = base64urlDecodeBytes(jwk.x);
  const y = base64urlDecodeBytes(jwk.y);
  if (x.length !== 32 || y.length !== 32) {
    throw new Error(`Invalid P-256 JWK: x.len=${x.length} y.len=${y.length}`);
  }
  // W3C did:key spec mandates compressed form for P-256.
  // Prefix 0x02 if y is even, 0x03 if y is odd, then 32-byte x.
  const compressed = new Uint8Array(33);
  compressed[0] = (y[31] & 0x01) === 0 ? 0x02 : 0x03;
  compressed.set(x, 1);

  const combined = new Uint8Array(W3C_P256_PREFIX.length + compressed.length);
  combined.set(W3C_P256_PREFIX);
  combined.set(compressed, W3C_P256_PREFIX.length);
  return 'z' + base58Encode(combined);
}

function base58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result += BASE58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }
  return result;
}
