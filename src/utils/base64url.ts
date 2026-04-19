// React Native has global btoa/atob via Hermes, but TS doesn't know about them.
// Declare them to avoid type errors.
declare function btoa(data: string): string;
declare function atob(data: string): string;
declare const TextDecoder:
  | (new (label?: string) => {decode: (input: Uint8Array) => string})
  | undefined;

export function base64urlEncode(data: string): string {
  const base64 = btoa(data);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlDecode(str: string): string {
  // atob produces a Latin-1 string (one char per byte). For payloads that
  // are actually UTF-8 (JWT headers/payloads, SD-JWT disclosures, JSON
  // wrapped in QR deeplinks) we must re-decode the bytes as UTF-8 — passing
  // the Latin-1 string straight to JSON.parse turns multi-byte sequences
  // into mojibake (e.g. `çåæ`).
  return utf8Decode(base64urlDecodeBytes(str));
}

export function base64urlDecodeBytes(str: string): Uint8Array {
  let padded = str.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function utf8Decode(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      out += String.fromCharCode(b1);
    } else if (b1 < 0xc0) {
      out += '\uFFFD';
    } else if (b1 < 0xe0) {
      const b2 = bytes[i++] & 0x3f;
      out += String.fromCharCode(((b1 & 0x1f) << 6) | b2);
    } else if (b1 < 0xf0) {
      const b2 = bytes[i++] & 0x3f;
      const b3 = bytes[i++] & 0x3f;
      out += String.fromCharCode(((b1 & 0x0f) << 12) | (b2 << 6) | b3);
    } else {
      const b2 = bytes[i++] & 0x3f;
      const b3 = bytes[i++] & 0x3f;
      const b4 = bytes[i++] & 0x3f;
      let cp = ((b1 & 0x07) << 18) | (b2 << 12) | (b3 << 6) | b4;
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return out;
}
