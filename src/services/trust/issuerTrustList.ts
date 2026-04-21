import {
  getAllIssuerTrust,
  getIssuerTrust,
  getLastFetchedAt,
  replaceIssuerTrustList,
  setLastFetchedAt,
  type IssuerTrust,
  type IssuerTrustOrg,
} from '../../db/issuerTrustDao';

const MODA_BASE_URL = 'https://frontend.wallet.gov.tw';

/**
 * Candidate paths for the issuer trust list (DWSDK-601i / downloadIssList).
 * The official TWDIW app hides the exact path inside its Flutter SDK bridge —
 * we probe these in order until one responds with a JSON array.
 */
const CANDIDATE_PATHS = [
  '/api/moda/dwapp/issuer/list',
  '/api/moda/issuer/list',
  '/api/moda/dwapp/trust/issList',
  '/api/moda/trust/issList',
];

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour, same as TWDIW

interface RawIssuerEntry {
  did?: string;
  org?: IssuerTrustOrg;
  status?: number;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Fetch the issuer trust list from the MODA backend. Probes candidate URLs
 * until one returns a JSON array. Returns null if none succeed — caller
 * should treat this as "keep using existing cache, don't wipe it".
 */
async function fetchFromNetwork(): Promise<IssuerTrust[] | null> {
  const now = Date.now();
  for (const path of CANDIDATE_PATHS) {
    try {
      const res = await fetch(`${MODA_BASE_URL}${path}`, {
        method: 'GET',
        headers: {Accept: 'application/json'},
      });
      if (!res.ok) continue;
      const body = (await res.json()) as unknown;
      const entries = extractEntries(body);
      if (!entries) continue;
      return entries.map(raw => toIssuerTrust(raw, now));
    } catch {
      /* try next path */
    }
  }
  return null;
}

function extractEntries(body: unknown): RawIssuerEntry[] | null {
  if (Array.isArray(body)) return body as RawIssuerEntry[];
  if (body && typeof body === 'object') {
    const wrapped = (body as {data?: unknown}).data;
    if (Array.isArray(wrapped)) return wrapped as RawIssuerEntry[];
  }
  return null;
}

function toIssuerTrust(raw: RawIssuerEntry, fetchedAt: number): IssuerTrust {
  return {
    did: raw.did ?? '',
    org: raw.org ?? {},
    status: raw.status ?? 0,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? null,
    fetchedAt,
  };
}

/**
 * Refresh the local cache if older than REFRESH_INTERVAL_MS (or if forced).
 * Silent on network failure — the cache simply goes stale.
 */
export async function refreshIssuerTrustList(
  opts: {force?: boolean} = {},
): Promise<void> {
  const last = getLastFetchedAt();
  const now = Date.now();
  if (!opts.force && last !== null && now - last < REFRESH_INTERVAL_MS) {
    return;
  }
  const entries = await fetchFromNetwork();
  if (!entries) return;
  replaceIssuerTrustList(entries);
  setLastFetchedAt(now);
}

/**
 * Synchronous lookup against the local cache. `null` = DID not on the list
 * (i.e. "not in official trust registry").
 */
export function lookupIssuerTrust(did: string | null | undefined): IssuerTrust | null {
  if (!did) return null;
  return getIssuerTrust(did);
}

export function isIssuerTrusted(did: string | null | undefined): boolean {
  const entry = lookupIssuerTrust(did);
  return entry !== null && entry.status === 1;
}

export function listAllIssuerTrust(): IssuerTrust[] {
  return getAllIssuerTrust();
}

export function pickLocalizedIssuerName(
  org: IssuerTrustOrg,
  locale: string,
): string | null {
  if (locale.toLowerCase().startsWith('zh')) {
    return org['zh-tw'] ?? org.name ?? null;
  }
  return org.en ?? org.name ?? null;
}
