import {v4 as uuidv4} from 'uuid';
import {httpClient} from '../api/http';
import {jwtDecode} from '../crypto/jwt';
import {createSignedJWT} from '../crypto/jws';
import type {DIDDocument} from './did';
import {deriveDid, getPublicKeyJwk} from './did';
import {detectDidFormatFromQr, type DidFormat} from './didFormat';
import {sdJwtEncode} from './sdjwt';
import {extractQueryParam, unwrapQr} from './qr';

export type VPErrorKind =
  | 'sessionNotFound'
  | 'network'
  | 'httpError'
  | 'malformedQr'
  | 'unsupportedQuery';

export class VPRequestError extends Error {
  kind: VPErrorKind;
  status?: number;
  backendCode?: string | number;
  backendMessage?: string;
  constructor(
    kind: VPErrorKind,
    message: string,
    extra?: {status?: number; backendCode?: string | number; backendMessage?: string},
  ) {
    super(message);
    this.kind = kind;
    this.status = extra?.status;
    this.backendCode = extra?.backendCode;
    this.backendMessage = extra?.backendMessage;
  }
}

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
 * Quick shape check for a VP authorize QR. Accepts wrapped TWDIW URLs,
 * raw `modadigitalwallet://authorize?...`, and any URI carrying `request_uri`.
 */
export function isVPAuthorizeQr(qrCode: string): boolean {
  const q = unwrapQr(qrCode);
  if (q.startsWith('modadigitalwallet://authorize')) return true;
  if (extractQueryParam(q, 'request_uri')) return true;
  return false;
}

/**
 * Dedupes concurrent parseVPRequest calls AND caches successful results.
 * The request_uri JWT is one-shot — a second GET after the first success
 * returns 400 "session consumed". We cache the parsed PresentationRequest
 * so re-mounts or navigate-back into VPAuth reuse it instead of re-fetching.
 */
const parseInFlight = new Map<string, Promise<PresentationRequest>>();
const parseCache = new Map<string, PresentationRequest>();
const rejectedQrs = new Map<string, VPErrorKind>();

/** Returns the cached rejection kind if this qrCode has already been rejected. */
export function getKnownVPRejection(qrCode: string): VPErrorKind | undefined {
  return rejectedQrs.get(qrCode);
}

/**
 * OID4VP-202i: Parse VP request from QR code
 * Ported from APPSDK/lib/openid_vc_vp.dart parseVPQrcode()
 */
export async function parseVPRequest(
  qrCode: string,
): Promise<PresentationRequest> {
  const cached = parseCache.get(qrCode);
  if (cached) return cached;
  const existing = parseInFlight.get(qrCode);
  if (existing) return existing;
  const promise = doParseVPRequest(qrCode)
    .then(result => {
      parseCache.set(qrCode, result);
      return result;
    })
    .catch(err => {
      if (
        err instanceof VPRequestError &&
        (err.kind === 'sessionNotFound' || err.kind === 'unsupportedQuery')
      ) {
        rejectedQrs.set(qrCode, err.kind);
      }
      throw err;
    })
    .finally(() => {
      parseInFlight.delete(qrCode);
    });
  parseInFlight.set(qrCode, promise);
  return promise;
}

/** Called by generateVP after a successful submission so the QR can't be replayed. */
export function clearVPRequestCache(qrCode: string): void {
  parseCache.delete(qrCode);
  parseInFlight.delete(qrCode);
}

async function doParseVPRequest(
  qrCode: string,
): Promise<PresentationRequest> {
  const didFormat = detectDidFormatFromQr(qrCode);
  console.log('[VP.parse] didFormat=', didFormat);
  const q = unwrapQr(qrCode);
  const requestUri = extractQueryParam(q, 'request_uri');

  if (!requestUri) {
    throw new VPRequestError('malformedQr', 'Missing request_uri in QR code');
  }

  console.log('[VP.parse] requestUri=', requestUri);
  let response;
  try {
    response = await httpClient.get(requestUri);
  } catch (e: any) {
    throw classifyHttpError(e, 'GET request_uri', {treat4xxAsExpired: true});
  }
  const requestToken = response.data;

  const {payload} = jwtDecode(
    typeof requestToken === 'string' ? requestToken : requestToken.toString(),
  );

  const pd = payload.presentation_definition as Record<string, unknown> | undefined;
  const dcql = (payload as any).dcql_query;
  console.log(
    '[VP.parse] hasPresentationDefinition=',
    !!pd,
    'hasDcqlQuery=',
    !!dcql,
    'client_id=',
    payload.client_id,
  );

  if (!pd && dcql) {
    throw new VPRequestError(
      'unsupportedQuery',
      'Verifier uses DCQL query (OpenID4VP 1.0) which is not yet supported',
    );
  }

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

    console.log('[VP.post] uri=', request.responseUri);
    console.log('[VP.post] state=', request.state, 'nonce=', request.nonce);
    console.log('[VP.post] submission=', presentationSubmission);
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
    if (error instanceof VPRequestError) throw error;
    throw classifyHttpError(error, 'POST response_uri');
  }
}

function classifyHttpError(
  e: any,
  label: string,
  opts?: {treat4xxAsExpired?: boolean},
): VPRequestError {
  const status = e?.response?.status;
  const body = e?.response?.data;
  const backendCode = extractBackendCode(body);
  const backendMessage = extractBackendMessage(body);
  const bodyStr =
    typeof body === 'object' ? JSON.stringify(body) : String(body ?? '');
  console.log(`[VP.${label}.err] status=`, status, 'body=', bodyStr);

  if (status === undefined) {
    return new VPRequestError('network', e?.message ?? `${label} network error`);
  }

  const is4xxExpired =
    !!opts?.treat4xxAsExpired && status >= 400 && status < 500;
  const isSessionMissing =
    backendCode === 4002 ||
    backendCode === '4002' ||
    (status === 404 && /session/i.test(backendMessage ?? '')) ||
    /request session is not exist/i.test(bodyStr) ||
    is4xxExpired;

  if (isSessionMissing) {
    return new VPRequestError(
      'sessionNotFound',
      backendMessage ?? 'Request session expired',
      {status, backendCode: backendCode ?? undefined, backendMessage},
    );
  }

  const detail = `HTTP ${status}${bodyStr ? `: ${bodyStr.slice(0, 300)}` : ''}`;
  return new VPRequestError('httpError', detail, {
    status,
    backendCode: backendCode ?? undefined,
    backendMessage,
  });
}

function extractBackendCode(body: unknown): string | number | undefined {
  if (body && typeof body === 'object' && 'code' in (body as any)) {
    const c = (body as any).code;
    if (typeof c === 'string' || typeof c === 'number') return c;
  }
  return undefined;
}

function extractBackendMessage(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'message' in (body as any)) {
    const m = (body as any).message;
    if (typeof m === 'string') return m;
  }
  return undefined;
}
