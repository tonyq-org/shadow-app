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

// Mirrors TWDIW Flutter SDK `getVCIssList` — GET /api/did paginated by
// size/page. Response envelope is {code:"0", data:{dids:[...], count:N}}.
// orgType=1 / status=1 match the official app: organizational issuers,
// status "enabled".
const ISS_LIST_PATH = '/api/did';
const PAGE_SIZE = 50;

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour, same as TWDIW

interface RawIssuerEntry {
  did?: string;
  org?: IssuerTrustOrg;
  status?: number;
  createdAt?: number;
  updatedAt?: number;
}

interface IssListPage {
  code?: string;
  data?: {
    dids?: RawIssuerEntry[];
    count?: number;
  };
}

async function fetchPage(
  page: number,
): Promise<{entries: RawIssuerEntry[]; count: number} | null> {
  const url = `${MODA_BASE_URL}${ISS_LIST_PATH}?size=${PAGE_SIZE}&page=${page}&orgType=1&status=1`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {Accept: 'application/json'},
    });
    if (!res.ok) return null;
    const body = (await res.json()) as IssListPage;
    if (body.code !== '0' || !body.data) return null;
    return {
      entries: body.data.dids ?? [],
      count: body.data.count ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the full issuer trust list by walking pages until we've seen `count`
 * entries. Returns null on any network/parse failure — caller keeps the
 * existing cache instead of wiping it.
 */
async function fetchFromNetwork(): Promise<IssuerTrust[] | null> {
  const now = Date.now();
  const first = await fetchPage(0);
  if (!first) return null;

  const all: RawIssuerEntry[] = [...first.entries];
  const total = first.count;
  let page = 1;
  while (all.length < total && first.entries.length > 0) {
    const next = await fetchPage(page);
    if (!next || next.entries.length === 0) break;
    all.push(...next.entries);
    page += 1;
    if (page > 100) break; // hard stop, protect against runaway pagination
  }
  return all.map(raw => toIssuerTrust(raw, now));
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
