import {getDatabase} from './database';

export interface IssuerTrustOrg {
  name?: string;
  type?: string;
  'zh-tw'?: string;
  en?: string;
  info?: string;
  taxId?: string;
}

export interface IssuerTrust {
  did: string;
  org: IssuerTrustOrg;
  status: number;
  updatedAt: number | null;
  fetchedAt: number;
}

export function replaceIssuerTrustList(entries: IssuerTrust[]): void {
  const db = getDatabase();
  db.execute('BEGIN TRANSACTION');
  try {
    db.execute('DELETE FROM issuer_trust');
    for (const e of entries) {
      db.execute(
        `INSERT INTO issuer_trust (did, org_json, status, updated_at, fetched_at)
         VALUES (?, ?, ?, ?, ?)`,
        [e.did, JSON.stringify(e.org), e.status, e.updatedAt, e.fetchedAt],
      );
    }
    db.execute('COMMIT');
  } catch (err) {
    db.execute('ROLLBACK');
    throw err;
  }
}

export function getIssuerTrust(did: string): IssuerTrust | null {
  const db = getDatabase();
  const result = db.execute(
    'SELECT * FROM issuer_trust WHERE did = ?',
    [did],
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export function getAllIssuerTrust(): IssuerTrust[] {
  const db = getDatabase();
  const result = db.execute('SELECT * FROM issuer_trust');
  return result.rows.map(mapRow);
}

const META_KEY_LAST_FETCH = 'issuer_trust.last_fetch';

export function getLastFetchedAt(): number | null {
  const db = getDatabase();
  const result = db.execute(
    'SELECT value FROM kv_meta WHERE key = ?',
    [META_KEY_LAST_FETCH],
  );
  if (result.rows.length === 0) return null;
  const raw = result.rows[0].value as string | null;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function setLastFetchedAt(ts: number): void {
  const db = getDatabase();
  db.execute(
    `INSERT INTO kv_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [META_KEY_LAST_FETCH, String(ts)],
  );
}

function mapRow(row: Record<string, unknown>): IssuerTrust {
  const orgRaw = row.org_json as string;
  let org: IssuerTrustOrg = {};
  try {
    org = JSON.parse(orgRaw) as IssuerTrustOrg;
  } catch {
    /* keep empty */
  }
  return {
    did: row.did as string,
    org,
    status: row.status as number,
    updatedAt: (row.updated_at as number | null) ?? null,
    fetchedAt: row.fetched_at as number,
  };
}
