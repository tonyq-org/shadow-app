import type {JWK} from '../crypto/jwt';
import {jwkToTwdiwMultibase, jwkToW3cMultibase} from '../../utils/multicodec';
import type {DidFormat} from './didFormat';

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: VerificationMethod[];
}

interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk: JWK;
}

export function generateDIDDocument(publicKeyJwk: JWK): DIDDocument {
  // Wallet's stored identity uses TWDIW format — this is what gets persisted
  // in the local DB and shown to the user. Per-protocol DIDs are derived
  // on demand via deriveDid() based on a format detected from the QR.
  const multibase = jwkToTwdiwMultibase({x: publicKeyJwk.x, y: publicKeyJwk.y});
  const didId = `did:key:${multibase}`;

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/jws-2020/v1',
    ],
    id: didId,
    verificationMethod: [
      {
        id: `${didId}#${multibase}`,
        type: 'JsonWebKey2020',
        controller: didId,
        publicKeyJwk,
      },
    ],
  };
}

export function deriveDid(
  jwk: JWK,
  format: DidFormat,
): {did: string; didUrl: string} {
  const multibase =
    format === 'twdiw'
      ? jwkToTwdiwMultibase({x: jwk.x, y: jwk.y})
      : jwkToW3cMultibase({x: jwk.x, y: jwk.y});
  const did = `did:key:${multibase}`;
  const didUrl = `${did}#${multibase}`;
  console.log('[DID] derive format=', format, 'did.len=', did.length);
  return {did, didUrl};
}

export function getDIDId(didDocument: DIDDocument): string {
  return didDocument.id;
}

export function getPublicKeyJwk(didDocument: DIDDocument): JWK {
  return didDocument.verificationMethod[0].publicKeyJwk;
}
