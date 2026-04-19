import {v4 as uuidv4} from 'uuid';
import {httpClient} from '../api/http';
import {jwtDecode} from '../crypto/jwt';
import {createSignedJWT} from '../crypto/jws';
import type {DIDDocument} from './did';
import {deriveDid, getPublicKeyJwk} from './did';
import {detectDidFormatFromQr, type DidFormat} from './didFormat';
import {sdJwtEncode} from './sdjwt';
import {extractQueryParam, unwrapQr} from './qr';

export interface PresentationRequest {
  clientId: string;
  nonce: string;
  state: string;
  responseUri: string;
  presentationDefinition: PresentationDefinition;
  verifierDid?: string;
  /** did:key encoding to use for the VP JWT, decided from the original QR. */
  didFormat: DidFormat;
}

export interface PresentationDefinition {
  id: string;
  inputDescriptors: InputDescriptor[];
  submissionRequirements?: SubmissionRequirement[];
}

export interface InputDescriptor {
  id: string;
  name?: string;
  purpose?: string;
  format?: Record<string, unknown>;
  constraints?: {
    fields?: Array<{
      path: string[];
      filter?: Record<string, unknown>;
    }>;
  };
}

interface SubmissionRequirement {
  name?: string;
  rule: 'all' | 'pick';
  count?: number;
  from?: string;
}

export interface VPResult {
  code: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * OID4VP-202i: Parse VP request from QR code
 * Ported from APPSDK/lib/openid_vc_vp.dart parseVPQrcode()
 */
export async function parseVPRequest(
  qrCode: string,
): Promise<PresentationRequest> {
  const didFormat = detectDidFormatFromQr(qrCode);
  console.log('[VP.parse] didFormat=', didFormat);
  const q = unwrapQr(qrCode);
  const requestUri = extractQueryParam(q, 'request_uri');

  if (!requestUri) {
    throw new Error('Missing request_uri in QR code');
  }

  const response = await httpClient.get(requestUri);
  const requestToken = response.data;

  const {payload} = jwtDecode(
    typeof requestToken === 'string' ? requestToken : requestToken.toString(),
  );

  return {
    clientId: (payload.client_id as string) ?? '',
    nonce: (payload.nonce as string) ?? '',
    state: (payload.state as string) ?? '',
    responseUri: (payload.response_uri as string) ?? '',
    presentationDefinition: parsePresentationDefinition(
      payload.presentation_definition as Record<string, unknown>,
    ),
    verifierDid: payload.client_id as string | undefined,
    didFormat,
  };
}

function parsePresentationDefinition(
  raw: Record<string, unknown>,
): PresentationDefinition {
  const inputDescriptors = (
    (raw?.input_descriptors as Array<Record<string, unknown>>) ?? []
  ).map(desc => ({
    id: desc.id as string,
    name: desc.name as string | undefined,
    purpose: desc.purpose as string | undefined,
    format: desc.format as Record<string, unknown> | undefined,
    constraints: desc.constraints as InputDescriptor['constraints'],
  }));

  return {
    id: (raw?.id as string) ?? uuidv4(),
    inputDescriptors,
    submissionRequirements: raw?.submission_requirements as
      | SubmissionRequirement[]
      | undefined,
  };
}

/**
 * OID4VP-203i: Generate and send Verifiable Presentation
 * Ported from APPSDK/lib/openid_vc_vp.dart generateVPKx()
 */
export async function generateVP(
  keyTag: string,
  didDocument: DIDDocument,
  request: PresentationRequest,
  vcs: Array<{jwt: string; disclosedFields?: string[]}>,
  customData?: string,
): Promise<VPResult> {
  try {
    const publicKeyJwk = getPublicKeyJwk(didDocument);
    const {did: didId} = deriveDid(publicKeyJwk, request.didFormat);
    const now = Math.floor(Date.now() / 1000);

    // Apply SD-JWT selective disclosure to each VC
    const vpCredentials = vcs.map(vc => {
      if (vc.disclosedFields && vc.disclosedFields.length > 0) {
        return sdJwtEncode(vc.jwt, vc.disclosedFields);
      }
      return vc.jwt;
    });

    // Create VP JWT
    const vpJwt = await createSignedJWT(keyTag, {
      alg: 'ES256',
      typ: 'JWT',
      jwk: publicKeyJwk,
    }, {
      sub: didId,
      aud: request.verifierDid ?? request.clientId,
      iss: didId,
      nbf: now,
      exp: now + 300, // 5 minutes
      nonce: request.nonce,
      jti: `urn:uuid:${uuidv4()}`,
      vp: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: vpCredentials,
      },
    });

    // Build presentation submission
    const descriptorMap = vcs.map((_, index) => ({
      id: request.presentationDefinition.inputDescriptors[index]?.id ?? `card_${index}`,
      format: 'jwt_vp',
      path: '$',
      path_nested: {
        id: request.presentationDefinition.inputDescriptors[index]?.id ?? `card_${index}`,
        format: 'jwt_vc',
        path: `$.vp.verifiableCredential[${index}]`,
      },
    }));

    const presentationSubmission = JSON.stringify({
      id: uuidv4(),
      definition_id: request.presentationDefinition.id,
      descriptor_map: descriptorMap,
    });

    // Send VP to verifier
    const params = new URLSearchParams();
    params.set('state', request.state);
    params.set('vp_token', vpJwt);
    params.set('presentation_submission', presentationSubmission);
    if (customData) {
      params.set('custom_data', customData);
    }

    const response = await httpClient.post(
      request.responseUri,
      params.toString(),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
    );

    return {
      code: '0',
      message: 'SUCCESS',
      data: response.data,
    };
  } catch (error: any) {
    return {
      code: '1',
      message: error.message ?? 'Failed to generate VP',
    };
  }
}
