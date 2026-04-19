import {base64urlDecode} from '../../utils/base64url';

/**
 * Unwrap TWDIW-style wrapper QR codes.
 *
 * Examples of wrappers that get unwrapped:
 *   https://frontend-uat.wallet.gov.tw/api/moda/vcqrcode?mode=vc01&deeplink=<base64>
 *   https://frontend.wallet.gov.tw/api/moda/vcqrcode?mode=vp01&deeplink=<base64>
 *
 * The base64 decodes to a native deep link like
 *   modadigitalwallet://credential_offer?credential_offer_uri=...
 *   modadigitalwallet://authorize?request_uri=...
 *
 * Returns the original string untouched if it isn't a recognized wrapper.
 */
export function unwrapQr(qrCode: string): string {
  const trimmed = qrCode.trim();
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const isTwdiwWrapper =
      /(^|\.)wallet\.gov\.tw$/.test(host) && url.pathname.includes('/vcqrcode');
    if (!isTwdiwWrapper) return trimmed;
    const deeplink = url.searchParams.get('deeplink');
    if (!deeplink) return trimmed;
    const decoded = base64urlDecode(deeplink).replace(/[\r\n\s]+/g, '').trim();
    return decoded || trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Tolerant query-param extraction. Works for both standard URLs and
 * custom-scheme deep links that `new URL()` may not fully parse.
 */
export function extractQueryParam(uri: string, key: string): string | null {
  try {
    const v = new URL(uri).searchParams.get(key);
    if (v !== null) return v;
  } catch {
    /* fall through */
  }
  const marker = `${key}=`;
  const idx = uri.indexOf(marker);
  if (idx < 0) return null;
  const rest = uri.slice(idx + marker.length);
  const end = rest.indexOf('&');
  const raw = end >= 0 ? rest.slice(0, end) : rest;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
