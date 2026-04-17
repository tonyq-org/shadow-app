/**
 * Convert DER-encoded ECDSA signature to raw (r || s) format.
 * DER format: 30 [len] 02 [r_len] [r] 02 [s_len] [s]
 * Raw format: r (32 bytes) || s (32 bytes) = 64 bytes total
 */
export function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);

  let offset = 2; // skip 30 [len]
  const rLen = der[offset + 1];
  offset += 2;
  let rStart = offset;
  if (rLen === 33 && der[rStart] === 0) {
    rStart += 1;
  }
  const rBytes = der.slice(rStart, offset + rLen);
  raw.set(rBytes.slice(Math.max(0, rBytes.length - 32)), 32 - Math.min(rBytes.length, 32));

  offset += rLen;
  const sLen = der[offset + 1];
  offset += 2;
  let sStart = offset;
  if (sLen === 33 && der[sStart] === 0) {
    sStart += 1;
  }
  const sBytes = der.slice(sStart, offset + sLen);
  raw.set(sBytes.slice(Math.max(0, sBytes.length - 32)), 32 + 32 - Math.min(sBytes.length, 32));

  return raw;
}

/**
 * Convert raw (r || s) signature to DER-encoded format.
 */
export function rawToDer(raw: Uint8Array): Uint8Array {
  const r = raw.slice(0, 32);
  const s = raw.slice(32, 64);

  const rDer = integerToDer(r);
  const sDer = integerToDer(s);

  const totalLen = rDer.length + sDer.length;
  const der = new Uint8Array(2 + totalLen);
  der[0] = 0x30;
  der[1] = totalLen;
  der.set(rDer, 2);
  der.set(sDer, 2 + rDer.length);
  return der;
}

function integerToDer(value: Uint8Array): Uint8Array {
  let start = 0;
  while (start < value.length - 1 && value[start] === 0) {
    start++;
  }
  const trimmed = value.slice(start);
  const needsPadding = trimmed[0] >= 0x80;
  const len = trimmed.length + (needsPadding ? 1 : 0);
  const result = new Uint8Array(2 + len);
  result[0] = 0x02;
  result[1] = len;
  if (needsPadding) {
    result[2] = 0x00;
    result.set(trimmed, 3);
  } else {
    result.set(trimmed, 2);
  }
  return result;
}

export function bytesToBits(bytes: Uint8Array): number[] {
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }
  return bits;
}
