import type {JWK} from '../crypto/jwt';
import {jwkToMultibase} from '../../utils/multicodec';

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
  const multibase = jwkToMultibase({x: publicKeyJwk.x, y: publicKeyJwk.y});
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

export function getDIDId(didDocument: DIDDocument): string {
  return didDocument.id;
}

export function getPublicKeyJwk(didDocument: DIDDocument): JWK {
  return didDocument.verificationMethod[0].publicKeyJwk;
}
