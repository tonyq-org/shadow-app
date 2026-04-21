import {httpClient} from '../api/http';
import {createSignedJWT} from '../crypto/jws';

const MODA_BASE_URL = 'https://frontend.wallet.gov.tw';

export interface VcCatalogItem {
  vcUid: string;
  name: string;
  /** type=1 → open in external browser; type=2 → open in embedded webview. */
  type: 1 | 2;
  issuerServiceUrl: string;
  logoUrl?: string;
}

/** DwModa301i — GET the available issuer catalog. Anonymous. */
export async function fetchVcCatalog(): Promise<VcCatalogItem[]> {
  const res = await httpClient.get(
    `${MODA_BASE_URL}/api/moda/dwapp/apply/vcList`,
    {params: {page: 0, size: 50}},
  );
  const items = res.data?.data?.vcItems ?? [];
  return items.map((it: any) => ({
    vcUid: it.vcUid,
    name: it.name,
    type: it.type === 2 ? 2 : 1,
    issuerServiceUrl: it.issuerServiceUrl,
    logoUrl: it.logoUrl,
  }));
}

export interface VpScenario {
  vpUid: string;
  name: string;
  verifierModuleUrl: string;
  logoUrl?: string;
}

export interface OfflineTransaction {
  vpUid: string;
  verifierModuleUrl: string;
  transactionId: string;
  deepLink: string;
}

export interface OfflineBarcode {
  qrcode: string;
  totptimeout: number;
}

/** DwModa401i — GET VP scenario list. Anonymous. */
export async function fetchVpScenarios(): Promise<VpScenario[]> {
  const res = await httpClient.get(
    `${MODA_BASE_URL}/api/moda/dwapp/offline/vpList`,
    {params: {page: 0, size: 50}},
  );
  const items = res.data?.data?.vpItems ?? [];
  return items.map((it: any) => ({
    vpUid: it.vpUid,
    name: it.name,
    verifierModuleUrl: it.verifierModuleUrl,
    logoUrl: it.logoUrl,
  }));
}

/**
 * DwVerifierMgr401i — per-verifier offline transaction start.
 * Returns transactionId and a `modadigitalwallet://authorize?...` deepLink that
 * can be fed into the standard OID4VP flow like any scanned verifier QR.
 */
export async function startOfflineTransaction(
  vpUid: string,
  verifierModuleUrl: string,
): Promise<OfflineTransaction> {
  const res = await httpClient.get(
    `${verifierModuleUrl}/api/ext/offline/qrcode/${encodeURIComponent(vpUid)}`,
  );
  const data = res.data?.data;
  if (!data?.transactionId || !data?.deepLink) {
    throw new Error('Invalid DwVerifierMgr401i response');
  }
  return {
    vpUid,
    verifierModuleUrl,
    transactionId: data.transactionId,
    deepLink: data.deepLink,
  };
}

/**
 * DwVerifierMgr402i — after the VP has been submitted for `transactionId`,
 * sign a minimal `{transactionId}` JWT with the holder DID key and POST it to
 * receive the POS-facing encrypted PNG barcode to display.
 *
 * The verifier backend looks up the holder DID stored against transactionId
 * (from the VP it just accepted) and validates the JWT signature against it —
 * no iss/aud/iat/exp required in the payload.
 */
export async function fetchOfflineBarcode(
  verifierModuleUrl: string,
  transactionId: string,
  keyTag: string,
): Promise<OfflineBarcode> {
  const jwt = await createSignedJWT(
    keyTag,
    {alg: 'ES256', typ: 'JWS'},
    {transactionId},
  );
  const res = await httpClient.post(
    `${verifierModuleUrl}/api/ext/offline/getEncryptionData`,
    {jwt},
  );
  const data = res.data?.data;
  if (!data?.qrcode) {
    throw new Error('Invalid DwVerifierMgr402i response');
  }
  const timeout = Number(data.totptimeout ?? 60);
  return {
    qrcode: data.qrcode,
    totptimeout: Number.isFinite(timeout) ? timeout : 60,
  };
}
