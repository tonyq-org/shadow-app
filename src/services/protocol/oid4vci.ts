import {httpClient} from '../api/http';
import {createSignedJWT} from '../crypto/jws';
import type {DIDDocument} from './did';
import {deriveDid, getPublicKeyJwk} from './did';
import {detectDidFormatFromQr, type DidFormat} from './didFormat';
import {extractQueryParam, unwrapQr} from './qr';

export interface CredentialOffer {
  credentialIssuer: string;
  preAuthorizedCode: string;
  credentialConfigurationIds: string[];
  txCode?: {
    inputMode?: string;
    length?: number;
    description?: string;
  };
  /** did:key encoding to use for the proof JWT, decided from the original QR. */
  didFormat: DidFormat;
}

export function isCredentialOfferQr(qrCode: string): boolean {
  const q = unwrapQr(qrCode);
  console.log('[VCI.isOffer] raw len=', qrCode.length, 'raw=', JSON.stringify(qrCode));
  console.log('[VCI.isOffer] unwrapped len=', q.length, 'unwrapped=', JSON.stringify(q));
  if (q.startsWith('openid-credential-offer://')) {
    console.log('[VCI.isOffer] match openid-credential-offer');
    return true;
  }
  if (q.startsWith('modadigitalwallet://credential_offer')) {
    const v1 = extractQueryParam(q, 'credential_offer_uri');
    const v2 = extractQueryParam(q, 'credential_offer');
    console.log('[VCI.isOffer] moda branch offer_uri=', v1, 'offer=', v2);
    return v1 !== null || v2 !== null;
  }
  try {
    const url = new URL(q);
    const ok =
      url.searchParams.has('credential_offer_uri') ||
      url.searchParams.has('credential_offer');
    console.log('[VCI.isOffer] url branch host=', url.hostname, 'ok=', ok);
    return ok;
  } catch (e) {
    console.log('[VCI.isOffer] URL parse failed', String(e));
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
  display?: CredentialDisplay[];
}

export interface CredentialDisplay {
  name?: string;
  locale?: string;
  description?: string;
  background_image?: {uri?: string};
  logo?: {uri?: string; alt_text?: string};
  background_color?: string;
  text_color?: string;
}

/**
 * Pick the display entry that best matches the requested locale.
 * Falls back to: exact match → language-only match → first entry.
 */
export function pickCredentialDisplay(
  configs: Record<string, CredentialConfig>,
  credentialId: string,
  locale: string,
): CredentialDisplay | undefined {
  const list = configs[credentialId]?.display;
  if (!list || list.length === 0) return undefined;
  const exact = list.find(d => d.locale === locale);
  if (exact) return exact;
  const lang = locale.split('-')[0];
  const langOnly = list.find(d => d.locale?.split('-')[0] === lang);
  return langOnly ?? list[0];
}

export interface VCResult {
  code: string;
  message: string;
  data?: {
    credential: string;
    credentialId: string;
    metadata?: IssuerMetadata;
  };
}

/**
 * OID4VCI-101i: Parse credential offer from QR code URL
 */
export async function getCredentialOffer(
  qrCode: string,
): Promise<CredentialOffer> {
  console.log('[VCI.offer] raw qr=', qrCode);
  const didFormat = detectDidFormatFromQr(qrCode);
  console.log('[VCI.offer] didFormat=', didFormat);
  const q = unwrapQr(qrCode);
  console.log('[VCI.offer] unwrapped=', q);
  const credentialOfferUri = extractQueryParam(q, 'credential_offer_uri');
  const credentialOfferInline = extractQueryParam(q, 'credential_offer');
  console.log(
    '[VCI.offer] credential_offer_uri=',
    credentialOfferUri,
    'inline?',
    credentialOfferInline ? `len=${credentialOfferInline.length}` : 'no',
  );

  let data: any;
  if (credentialOfferUri) {
    let response;
    try {
      response = await httpClient.get(credentialOfferUri);
    } catch (e: any) {
      const status = e?.response?.status;
      const body = e?.response?.data;
      console.log('[VCI.offer] GET failed status=', status, 'body=', typeof body === 'object' ? JSON.stringify(body) : String(body));
      throw new Error(
        status
          ? `GET credential_offer_uri ${status}: ${typeof body === 'object' ? JSON.stringify(body) : body}`
          : e.message,
      );
    }
    console.log('[VCI.offer] GET ok, data=', JSON.stringify(response.data));
    data = response.data;
  } else if (credentialOfferInline) {
    try {
      data = JSON.parse(credentialOfferInline);
    } catch (e: any) {
      throw new Error(`Invalid inline credential_offer JSON: ${e.message}`);
    }
    console.log('[VCI.offer] inline parsed, data=', JSON.stringify(data));
  } else {
    throw new Error('Missing credential_offer or credential_offer_uri in QR code');
  }

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
    didFormat,
  };
}

/**
 * OID4VCI-102i: Get issuer metadata
 *
 * Per OID4VCI 1.0 §11.2, the token endpoint is NOT carried in the credential
 * issuer metadata — it lives in the authorization server metadata at
 * `<AS>/.well-known/oauth-authorization-server` (RFC 8414) or
 * `<AS>/.well-known/openid-configuration` (OIDC Discovery). The AS URL is
 * the first entry of `authorization_servers`, defaulting to the credential
 * issuer when the field is omitted. EUDI's dev issuer is the canonical case:
 * the credential endpoint lives on a different host than the AS.
 */
export async function getIssuerMetadata(
  issuerUrl: string,
): Promise<IssuerMetadata> {
  const base = issuerUrl.replace(/\/+$/, '');
  const response = await httpClient.get(
    `${base}/.well-known/openid-credential-issuer`,
  );
  const data = response.data;

  let tokenEndpoint: string | undefined = data.token_endpoint;
  if (!tokenEndpoint) {
    const asUrl: string = (data.authorization_servers?.[0] ?? base).replace(
      /\/+$/,
      '',
    );
    tokenEndpoint = await discoverTokenEndpoint(asUrl);
  }

  return {
    credentialIssuer: data.credential_issuer,
    credentialEndpoint: data.credential_endpoint,
    tokenEndpoint: tokenEndpoint ?? `${base}/token`,
    credentialConfigurationsSupported:
      data.credential_configurations_supported ?? {},
  };
}

async function discoverTokenEndpoint(asUrl: string): Promise<string | undefined> {
  const candidates = [
    `${asUrl}/.well-known/oauth-authorization-server`,
    `${asUrl}/.well-known/openid-configuration`,
  ];
  for (const url of candidates) {
    try {
      const res = await httpClient.get(url);
      const ep = res.data?.token_endpoint;
      if (typeof ep === 'string' && ep.length > 0) {
        console.log('[VCI.meta] token_endpoint discovered at', url, '=>', ep);
        return ep;
      }
    } catch (e: any) {
      console.log('[VCI.meta] AS discovery miss', url, e?.response?.status ?? e?.message);
    }
  }
  return undefined;
}

/**
 * OID4VCI-104i: Get access token
 */
export async function getAccessToken(
  tokenUrl: string,
  preAuthorizedCode: string,
  credentialId: string,
  clientId: string,
  txCode?: string,
): Promise<{accessToken: string; cNonce: string}> {
  const params = new URLSearchParams();
  params.set(
    'grant_type',
    'urn:ietf:params:oauth:grant-type:pre-authorized_code',
  );
  params.set('client_id', clientId);
  params.set('pre-authorized_code', preAuthorizedCode);
  params.set(
    'authorization_details',
    JSON.stringify([
      {type: 'openid_credential', credential_configuration_id: credentialId},
    ]),
  );
  if (txCode !== undefined) {
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
  didFormat: DidFormat,
): Promise<string> {
  // OID4VCI Draft 13/14:
  //   - `credential_identifier` is only valid if the token response echoed
  //     `authorization_details[].credential_identifiers`. Most W3C-spec
  //     issuers (EUDI, etc.) NPE when they get this without prior binding.
  //   - `credential_configuration_id` is the safe identifier from the offer.
  // TWDIW (moda) historically uses `credential_identifier`.
  const idField = didFormat === 'twdiw' ? 'credential_identifier' : 'credential_configuration_id';
  const requestBody = {
    [idField]: credentialId,
    proofs: {jwt: [proofJwt]},
  };
  console.log('[VCI.cred] request body keys=', Object.keys(requestBody), 'idField=', idField);

  const response = await httpClient.post(credentialUrl, requestBody, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const body = response.data;
  console.log(
    '[VCI.cred] raw response=',
    typeof body === 'string' ? body.slice(0, 400) : JSON.stringify(body).slice(0, 600),
  );

  // OID4VCI response shape varies across drafts/implementations:
  //   Draft 13+ batch:  { credentials: [{ credential: "..." }] }
  //   EUDI variant:     { credentials: ["..."] }                  (string elements)
  //   Draft 11 single:  { credential: "..." }
  const arr = body?.credentials;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0];
    if (typeof first === 'string') return first;
    if (first?.credential) return first.credential;
  }
  return body?.credential;
}

/**
 * Full OID4VCI flow: Apply for a Verifiable Credential
 * Ported from APPSDK/lib/openid_vc_vp.dart applyVCKx()
 */
export async function applyVC(
  keyTag: string,
  didDocument: DIDDocument,
  offerOrQr: CredentialOffer | string,
  txCode: string,
): Promise<VCResult> {
  try {
    let offer: CredentialOffer;
    if (typeof offerOrQr === 'string') {
      console.log('[VCI] step1 getCredentialOffer qrCode=', offerOrQr);
      offer = await getCredentialOffer(offerOrQr);
      console.log('[VCI] step1 offer=', JSON.stringify(offer));
    } else {
      offer = offerOrQr;
      console.log('[VCI] step1 using cached offer=', JSON.stringify(offer));
    }

    console.log('[VCI] step2 getIssuerMetadata', offer.credentialIssuer);
    const metadata = await getIssuerMetadata(offer.credentialIssuer);
    console.log('[VCI] step2 metadata=', JSON.stringify({
      credentialIssuer: metadata.credentialIssuer,
      credentialEndpoint: metadata.credentialEndpoint,
      tokenEndpoint: metadata.tokenEndpoint,
      configs: Object.keys(metadata.credentialConfigurationsSupported),
    }));

    const credentialId = offer.credentialConfigurationIds[0];
    const clientId = offer.didFormat === 'twdiw' ? 'moda_dw' : 'shadow_wallet';
    // TWDIW: tx_code is mandatory in the form (empty string allowed).
    // W3C-standard issuers: only send tx_code when caller actually has one.
    const effectiveTxCode =
      offer.didFormat === 'twdiw' ? txCode ?? '' : txCode || undefined;
    console.log('[VCI] credentialId=', credentialId, 'clientId=', clientId, 'txCode=', effectiveTxCode === undefined ? '<omit>' : `<len=${effectiveTxCode.length}>`);

    console.log('[VCI] step3 getAccessToken', metadata.tokenEndpoint);
    const {accessToken, cNonce} = await getAccessToken(
      metadata.tokenEndpoint,
      offer.preAuthorizedCode,
      credentialId,
      clientId,
      effectiveTxCode,
    );
    console.log('[VCI] step3 token len=', accessToken?.length, 'cNonce=', cNonce);

    const jwk = getPublicKeyJwk(didDocument);
    const proofJwk = {kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y};
    const {did, didUrl} = deriveDid(jwk, offer.didFormat);
    // OID4VCI §8.2.1.1 says jwk/kid/x5c are mutually exclusive, but in
    // practice issuers diverge: EUDI/WaltID/MATTR validate jwk; moda only
    // accepts kid pointing at their non-standard did:key. Sending both lets
    // each side pick the field it knows. moda parses kid as bare did:key
    // and chokes on the #fragment, so only w3c uses the didUrl form.
    const kid = offer.didFormat === 'twdiw' ? did : didUrl;
    console.log('[VCI] step4 createSignedJWT format=', offer.didFormat, 'header=jwk+kid kid=', kid);
    const proofJwt = await createSignedJWT(keyTag, {
      alg: 'ES256',
      typ: 'openid4vci-proof+jwt',
      jwk: proofJwk,
      kid,
    }, {
      iss: clientId,
      aud: offer.credentialIssuer,
      iat: Math.floor(Date.now() / 1000),
      nonce: cNonce,
    });
    console.log('[VCI] step4 proofJwt len=', proofJwt.length);

    console.log('[VCI] step5 getCredential', metadata.credentialEndpoint);
    const credential = await getCredential(
      metadata.credentialEndpoint,
      accessToken,
      credentialId,
      proofJwt,
      offer.didFormat,
    );

    console.log('[VCI] step5 credential len=', credential?.length);
    return {
      code: '0',
      message: 'SUCCESS',
      data: {credential, credentialId, metadata},
    };
  } catch (error: any) {
    const status = error?.response?.status;
    const body = error?.response?.data;
    const url = error?.config?.url;
    console.log('[VCI] FAILED url=', url, 'status=', status, 'body=', typeof body === 'object' ? JSON.stringify(body) : String(body));
    const detail = status
      ? `HTTP ${status} @ ${url} :: ${typeof body === 'object' ? JSON.stringify(body) : body}`
      : error.message ?? 'Failed to apply VC';
    return {
      code: '1',
      message: detail,
    };
  }
}
