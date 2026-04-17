import {NativeModules} from 'react-native';
import {pbkdf2} from '@noble/hashes/pbkdf2.js';
import {sha256} from '@noble/hashes/sha2.js';
import {randomBytes, bytesToHex} from '@noble/hashes/utils.js';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_LEN = 32;

const nativeKm = NativeModules.KeyManagerModule as
  | {
      pbkdf2?: (
        password: string,
        saltHex: string,
        iterations: number,
        keyLenBytes: number,
      ) => Promise<string>;
    }
  | undefined;

export function generateSalt(): string {
  return bytesToHex(randomBytes(SALT_BYTES));
}

export function hashPin(pin: string, saltHex: string): string {
  const salt = hexToBytes(saltHex);
  const pinBytes = utf8ToBytes(pin);
  const derived = pbkdf2(sha256, pinBytes, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_LEN,
  });
  return bytesToHex(derived);
}

function utf8ToBytes(s: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return new Uint8Array(bytes);
}

export function verifyPin(pin: string, saltHex: string, expectedHashHex: string): boolean {
  const actual = hashPin(pin, saltHex);
  return timingSafeEqual(actual, expectedHashHex);
}

export async function hashPinAsync(pin: string, saltHex: string): Promise<string> {
  if (nativeKm?.pbkdf2) {
    return nativeKm.pbkdf2(pin, saltHex, PBKDF2_ITERATIONS, KEY_LEN);
  }
  return new Promise(resolve => {
    setTimeout(() => resolve(hashPin(pin, saltHex)), 50);
  });
}

export async function verifyPinAsync(
  pin: string,
  saltHex: string,
  expectedHashHex: string,
): Promise<boolean> {
  const actual = await hashPinAsync(pin, saltHex);
  return timingSafeEqual(actual, expectedHashHex);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
