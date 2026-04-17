import {jwtDecode, jwtDecodePayload} from '../crypto/jwt';
import type {JWK} from '../crypto/jwt';
import type {DIDDocument} from '../protocol/did';
import {getDIDId} from '../protocol/did';
import {httpClient} from '../api/http';
import {verifyJwt} from '../crypto/verifyJwt';
import {checkRevocationStatus} from './statusList';

function extractIssuerJwkFromDidJwt(didJwt: string): JWK | null {
  try {
    const payload = jwtDecodePayload(didJwt) as Record<string, unknown>;
    const methods = payload.verificationMethod as
      | Array<{publicKeyJwk?: JWK}>
      | undefined;
    const jwk = methods?.[0]?.publicKeyJwk;
    return jwk ?? null;
  } catch {
    return null;
  }
}

export interface VerifyResult {
  isValid: boolean;
  trust: boolean;
  issuerValid: boolean;
  holderMatch: boolean;
  notExpired: boolean;
  notRevoked: boolean;
  signatureValid: boolean;
  trustBadge?: string;
}

export interface Issuer {
  did: string;
  status: number;
  orgName?: string;
  orgType?: number;
  didJwt?: string;
}

/**
 * Online VC verification.
 * Ported from APPSDK/lib/openid_vc_vp.dart verifyVC()
 */
export async function verifyVC(
  vcJwt: string,
  didDocument: DIDDocument,
  frontUrl: string,
): Promise<VerifyResult> {
  const {payload} = jwtDecode(vcJwt.split('~')[0]);
  const holderDid = getDIDId(didDocument);

  const result: VerifyResult = {
    isValid: false,
    trust: false,
    issuerValid: false,
    holderMatch: false,
    notExpired: false,
    notRevoked: false,
    signatureValid: false,
  };

  // Check holder DID match
  result.holderMatch = payload.sub === holderDid;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  result.notExpired = !payload.exp || payload.exp > now;

  // Check issuer trust + capture issuer JWK for signature verification
  const issuerDid = payload.iss as string;
  let issuerJwk: JWK | null = null;
  if (issuerDid && frontUrl) {
    try {
      const response = await httpClient.get(`${frontUrl}/api/did/${issuerDid}`);
      const body = response.data as Record<string, unknown>;
      const issuerData = (body?.data ?? body) as Record<string, unknown>;
      result.trust = issuerData?.status === 1;
      result.issuerValid = true;
      result.trustBadge = issuerData?.orgName as string | undefined;
      const didJwt = issuerData?.did as string | undefined;
      if (didJwt) {
        issuerJwk = extractIssuerJwkFromDidJwt(didJwt);
      }
    } catch {
      result.trust = false;
    }
  }

  // Check revocation status
  const vc = payload.vc as Record<string, unknown> | undefined;
  const credentialStatus = vc?.credentialStatus as Record<string, unknown> | undefined;
  if (credentialStatus?.statusListCredential) {
    try {
      const statusListUrl = credentialStatus.statusListCredential as string;
      const statusIndex = Number(credentialStatus.statusListIndex);
      result.notRevoked = await checkRevocationStatus(
        statusListUrl,
        statusIndex,
        async url => {
          const resp = await httpClient.get(url);
          return typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        },
      );
    } catch {
      result.notRevoked = false;
    }
  } else {
    result.notRevoked = true;
  }

  // Verify JWT signature with issuer's public key (aligned with original verifyJwt)
  result.signatureValid = issuerJwk
    ? verifyJwt(vcJwt.split('~')[0], issuerJwk)
    : false;

  result.isValid =
    result.trust &&
    result.holderMatch &&
    result.notExpired &&
    result.notRevoked &&
    result.signatureValid;

  return result;
}

/**
 * Offline VC verification using downloaded issuer list and VC status lists.
 * Ported from APPSDK/lib/openid_vc_vp.dart verifyVCOffline()
 */
export async function verifyVCOffline(
  vcJwt: string,
  didDocument: DIDDocument,
  issList: Issuer[],
  vcStatusData: Map<string, string>,
): Promise<VerifyResult> {
  const {payload} = jwtDecode(vcJwt.split('~')[0]);
  const holderDid = getDIDId(didDocument);

  const result: VerifyResult = {
    isValid: false,
    trust: false,
    issuerValid: false,
    holderMatch: false,
    notExpired: false,
    notRevoked: false,
    signatureValid: false,
  };

  result.holderMatch = payload.sub === holderDid;

  const now = Math.floor(Date.now() / 1000);
  result.notExpired = !payload.exp || payload.exp > now;

  // Check issuer in downloaded list
  const issuerDid = payload.iss as string;
  const issuer = issList.find(i => i.did === issuerDid);
  result.trust = issuer?.status === 1;
  result.issuerValid = !!issuer;
  result.trustBadge = issuer?.orgName;

  // Check revocation from downloaded status lists
  const vc = payload.vc as Record<string, unknown> | undefined;
  const credentialStatus = vc?.credentialStatus as Record<string, unknown> | undefined;
  if (credentialStatus?.statusListCredential) {
    const statusListUrl = credentialStatus.statusListCredential as string;
    const statusIndex = Number(credentialStatus.statusListIndex);
    const statusListJwt = vcStatusData.get(statusListUrl);
    if (statusListJwt) {
      try {
        result.notRevoked = await checkRevocationStatus(
          statusListUrl,
          statusIndex,
          async () => statusListJwt,
        );
      } catch {
        result.notRevoked = false;
      }
    }
  } else {
    result.notRevoked = true;
  }

  const issuerJwk = issuer?.didJwt
    ? extractIssuerJwkFromDidJwt(issuer.didJwt)
    : null;
  result.signatureValid = issuerJwk
    ? verifyJwt(vcJwt.split('~')[0], issuerJwk)
    : false;

  result.isValid =
    result.trust &&
    result.holderMatch &&
    result.notExpired &&
    result.notRevoked &&
    result.signatureValid;

  return result;
}
