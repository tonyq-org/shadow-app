import {base64urlDecode} from '../../utils/base64url';

export interface SDJWTDecoded {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  disclosures: SDJWTDisclosure[];
  signature: string;
}

export interface SDJWTDisclosure {
  salt: string;
  key: string;
  value: unknown;
  encoded: string;
}

/**
 * Decode an SD-JWT token.
 * Format: header.payload.signature~disclosure1~disclosure2~...
 */
export function sdJwtDecode(token: string): SDJWTDecoded {
  const parts = token.split('~');
  const jwtPart = parts[0];
  const disclosureParts = parts.slice(1).filter(p => p.length > 0);

  const jwtSegments = jwtPart.split('.');
  const header = JSON.parse(base64urlDecode(jwtSegments[0]));
  const payload = JSON.parse(base64urlDecode(jwtSegments[1]));
  const signature = jwtSegments[2];

  const disclosures = disclosureParts.map(encoded => {
    const decoded = JSON.parse(base64urlDecode(encoded));
    return {
      salt: decoded[0] as string,
      key: decoded[1] as string,
      value: decoded[2],
      encoded,
    };
  });

  // Apply disclosures to payload
  if (payload._sd && Array.isArray(payload._sd)) {
    for (const disclosure of disclosures) {
      payload[disclosure.key] = disclosure.value;
    }
  }

  // Handle nested SD claims in vc.credentialSubject
  if (payload.vc?.credentialSubject?._sd) {
    for (const disclosure of disclosures) {
      payload.vc.credentialSubject[disclosure.key] = disclosure.value;
    }
  }

  return {header, payload, disclosures, signature};
}

/**
 * Encode an SD-JWT with selective disclosure.
 * Only include disclosures for the specified fields.
 */
export function sdJwtEncode(
  token: string,
  disclosedFields: string[],
): string {
  const parts = token.split('~');
  const jwtPart = parts[0];
  const disclosureParts = parts.slice(1).filter(p => p.length > 0);

  const selectedDisclosures = disclosureParts.filter(encoded => {
    try {
      const decoded = JSON.parse(base64urlDecode(encoded));
      const key = decoded[1] as string;
      return disclosedFields.includes(key);
    } catch {
      return false;
    }
  });

  if (selectedDisclosures.length === 0) {
    return jwtPart + '~';
  }

  return jwtPart + '~' + selectedDisclosures.join('~') + '~';
}
