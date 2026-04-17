import {base64urlDecodeBytes} from './base64url';

const MULTICODEC_P256_PREFIX = new Uint8Array([0x80, 0x24]);
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function jwkToMultibase(jwk: {x: string; y: string}): string {
  const x = base64urlDecodeBytes(jwk.x);
  const y = base64urlDecodeBytes(jwk.y);

  // Uncompressed public key: 0x04 || x || y
  const uncompressed = new Uint8Array(1 + x.length + y.length);
  uncompressed[0] = 0x04;
  uncompressed.set(x, 1);
  uncompressed.set(y, 1 + x.length);

  // Multicodec: prefix || uncompressed
  const multicodec = new Uint8Array(
    MULTICODEC_P256_PREFIX.length + uncompressed.length,
  );
  multicodec.set(MULTICODEC_P256_PREFIX);
  multicodec.set(uncompressed, MULTICODEC_P256_PREFIX.length);

  return 'z' + base58Encode(multicodec);
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
