import {base64urlDecodeBytes} from '../../utils/base64url';
import {bytesToBits} from '../../utils/encoding';
import {jwtDecodePayload} from '../crypto/jwt';

/**
 * Check if a credential is revoked by checking the status list.
 * Ported from APPSDK/lib/openid_vc_vp.dart checkVCValid()
 */
export async function checkRevocationStatus(
  statusListCredentialUrl: string,
  statusListIndex: number,
  fetchFn: (url: string) => Promise<string>,
): Promise<boolean> {
  const statusListJwt = await fetchFn(statusListCredentialUrl);
  const payload = jwtDecodePayload(statusListJwt);

  const statusList = payload.vc as Record<string, unknown>;
  const credentialSubject = statusList?.credentialSubject as Record<string, unknown>;
  const encodedList = credentialSubject?.encodedList as string;

  if (!encodedList) {
    throw new Error('Missing encodedList in status list credential');
  }

  const compressedBytes = base64urlDecodeBytes(encodedList);
  const decompressed = decompressGzip(compressedBytes);
  const bits = bytesToBits(decompressed);

  // bit = 0 means not revoked, bit = 1 means revoked
  return bits[statusListIndex] === 0;
}

function decompressGzip(compressed: Uint8Array): Uint8Array {
  // In React Native, we'd use a library like pako or react-native-gzip
  // For now, return as-is and implement with actual gzip library later
  // TODO: integrate pako or similar for gzip decompression
  return compressed;
}

export interface StatusListResult {
  isValid: boolean;
  index: number;
  url: string;
}
