import {v4 as uuidv4} from 'uuid';
import {httpClient} from '../api/http';
import {createSignedJWT} from '../crypto/jws';
import type {DIDDocument} from './did';
import {getDIDId} from './did';

export interface CredentialOffer {
  credentialIssuer: string;
  preAuthorizedCode: string;
  credentialConfigurationIds: string[];
  txCode?: {
    inputMode?: string;
    length?: number;
    description?: string;
  };
}

export function isCredentialOfferQr(qrCode: string): boolean {
  try {
    if (qrCode.startsWith('openid-credential-offer://')) return true;
    const url = new URL(qrCode);
    return url.searchParams.has('credential_offer_uri') ||
      url.searchParams.has('credential_offer');
  } catch {
    return false;
  }
}

export interface IssuerMetadata {
  credentialIssuer: string;
  credentialEndpoint: string;
  tokenEndpoint: string;
  credentialConfigurationsSupported: Record<string, CredentialConfig>;
}

interface CredentialConfig {
  format: string;
  scope: string;
  display?: Array<{name: string; locale: string}>;
}

export interface VCResult {
  code: string;
  message: string;
  data?: {
    credential: string;
    metadata?: IssuerMetadata;
  };
}

/**
 * OID4VCI-101i: Parse credential offer from QR code URL
 */
export async function getCredentialOffer(
  qrCode: string,
): Promise<CredentialOffer> {
  const url = new URL(qrCode);
  const credentialOfferUri = url.searchParams.get('credential_offer_uri');

  if (!credentialOfferUri) {
    throw new Error('Missing credential_offer_uri in QR code');
  }

  const response = await httpClient.get(credentialOfferUri);
  const data = response.data;

  const grants = data.grants?.['urn:ietf:params:oauth:grant-type:pre-authorized_code'];
  const rawTx = grants?.tx_code;

  return {
    credentialIssuer: data.credential_issuer,
    preAuthorizedCode: grants?.['pre-authorized_code'] ?? '',
    credentialConfigurationIds: data.credential_configuration_ids ?? [],
    txCode: rawTx
      ? {
          inputMode: rawTx.input_mode,
          length: rawTx.length,
          description: rawTx.description,
        }
      : undefined,
  };
}

/**
 * OID4VCI-102i: Get issuer metadata
 */
export async function getIssuerMetadata(
  issuerUrl: string,
): Promise<IssuerMetadata> {
  const response = await httpClient.get(
    `${issuerUrl}/.well-known/openid-credential-issuer`,
  );
  const data = response.data;

  return {
    credentialIssuer: data.credential_issuer,
    credentialEndpoint: data.credential_endpoint,
    tokenEndpoint: data.token_endpoint ?? `${issuerUrl}/token`,
    credentialConfigurationsSupported:
      data.credential_configurations_supported ?? {},
  };
}

/**
 * OID4VCI-104i: Get access token
 */
export async function getAccessToken(
  tokenUrl: string,
  preAuthorizedCode: string,
  credentialId: string,
  txCode?: string,
): Promise<{accessToken: string; cNonce: string}> {
  const params = new URLSearchParams();
  params.set(
    'grant_type',
    'urn:ietf:params:oauth:grant-type:pre-authorized_code',
  );
  params.set('client_id', uuidv4());
  params.set('pre-authorized_code', preAuthorizedCode);
  params.set(
    'authorization_details',
    JSON.stringify([
      {type: 'openid_credential', credential_configuration_id: credentialId},
    ]),
  );
  if (txCode) {
    params.set('tx_code', txCode);
  }

  const response = await httpClient.post(tokenUrl, params.toString(), {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  });

  return {
    accessToken: response.data.access_token,
    cNonce: response.data.c_nonce,
  };
}

/**
 * OID4VCI-105i: Get credential with proof
 */
async function getCredential(
  credentialUrl: string,
  accessToken: string,
  credentialId: string,
  proofJwt: string,
): Promise<string> {
  const response = await httpClient.post(
    credentialUrl,
    {
      credential_identifier: credentialId,
      proofs: {jwt: [proofJwt]},
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data.credentials?.[0]?.credential ?? response.data.credential;
}

/**
 * Full OID4VCI flow: Apply for a Verifiable Credential
 * Ported from APPSDK/lib/openid_vc_vp.dart applyVCKx()
 */
export async function applyVC(
  keyTag: string,
  didDocument: DIDDocument,
  qrCode: string,
  txCode: string,
): Promise<VCResult> {
  try {
    // Step 1: Parse credential offer
    const offer = await getCredentialOffer(qrCode);

    // Step 2: Get issuer metadata
    const metadata = await getIssuerMetadata(offer.credentialIssuer);

    const credentialId = offer.credentialConfigurationIds[0];

    // Step 3: Get access token
    const {accessToken, cNonce} = await getAccessToken(
      metadata.tokenEndpoint,
      offer.preAuthorizedCode,
      credentialId,
      txCode,
    );

    // Step 4: Create proof JWT
    const didId = getDIDId(didDocument);
    const proofJwt = await createSignedJWT(keyTag, {
      alg: 'ES256',
      typ: 'openid4vci-proof+jwt',
      kid: didId,
    }, {
      iss: 'shadow_wallet',
      aud: offer.credentialIssuer,
      iat: Math.floor(Date.now() / 1000),
      nonce: cNonce,
    });

    // Step 5: Get credential
    const credential = await getCredential(
      metadata.credentialEndpoint,
      accessToken,
      credentialId,
      proofJwt,
    );

    return {
      code: '0',
      message: 'SUCCESS',
      data: {credential, metadata},
    };
  } catch (error: any) {
    return {
      code: '1',
      message: error.message ?? 'Failed to apply VC',
    };
  }
}
