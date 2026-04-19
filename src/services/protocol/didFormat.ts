export type DidFormat = 'twdiw' | 'w3c';

/**
 * Decide which did:key encoding to use based on the *original* QR payload.
 *
 * TWDIW signal:
 *   - QR is a wrapper URL carrying a `deeplink=` query parameter, OR
 *   - QR is a raw `modadigitalwallet://` deep link.
 *
 * Anything else → W3C-standard did:key.
 */
export function detectDidFormatFromQr(rawQr: string): DidFormat {
  const trimmed = rawQr.trim();
  try {
    const url = new URL(trimmed);
    if (url.searchParams.has('deeplink')) return 'twdiw';
  } catch {
    /* not a parseable URL — fall through */
  }
  if (trimmed.startsWith('modadigitalwallet://')) return 'twdiw';
  return 'w3c';
}
