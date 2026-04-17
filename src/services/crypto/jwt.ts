import {base64urlEncode, base64urlDecode} from '../../utils/base64url';

export interface JWTHeader {
  alg: string;
  typ?: string;
  kid?: string;
  jwk?: JWK;
}

export interface JWK {
  kty: string;
  crv: string;
  x: string;
  y: string;
}

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  nonce?: string;
  jti?: string;
  [key: string]: unknown;
}

export function jwtEncode(header: JWTHeader, payload: JWTPayload): string {
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  return `${headerB64}.${payloadB64}`;
}

export function jwtDecode(token: string): {header: JWTHeader; payload: JWTPayload} {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid JWT format');
  }
  const header = JSON.parse(base64urlDecode(parts[0]));
  const payload = JSON.parse(base64urlDecode(parts[1]));
  return {header, payload};
}

export function jwtDecodePayload(token: string): JWTPayload {
  return jwtDecode(token).payload;
}
