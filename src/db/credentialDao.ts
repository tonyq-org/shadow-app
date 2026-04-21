import {v4 as uuidv4} from 'uuid';
import {getDatabase} from './database';
import type {Credential} from '../store/walletStore';
import {CredentialStatus} from '../store/walletStore';
import {
  DEFAULT_CREDENTIAL_FORMAT,
  detectCredentialFormat,
  type CredentialFormat,
} from '../services/protocol/credentialFormat';

export function saveCredential(
  walletId: string,
  rawJwt: string,
  issuerDid?: string,
  issuerName?: string,
  credentialType?: string,
  displayName?: string,
  displayImage?: string,
  issuedAt?: number,
  expiresAt?: number,
  format?: CredentialFormat,
): Credential {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();
  const resolvedFormat = format ?? detectCredentialFormat(rawJwt);

  db.execute(
    `INSERT INTO credential
     (id, wallet_id, raw_jwt, format, issuer_did, issuer_name, credential_type,
      display_name, display_image, status, issued_at, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, walletId, rawJwt, resolvedFormat,
      issuerDid ?? null, issuerName ?? null,
      credentialType ?? null, displayName ?? null, displayImage ?? null,
      CredentialStatus.Unverified, issuedAt ?? null, expiresAt ?? null, now,
    ],
  );

  return {
    id,
    walletId,
    rawJwt,
    format: resolvedFormat,
    issuerDid: issuerDid ?? null,
    issuerName: issuerName ?? null,
    credentialType: credentialType ?? null,
    displayName: displayName ?? null,
    displayImage: displayImage ?? null,
    status: CredentialStatus.Unverified,
    issuedAt: issuedAt ?? null,
    expiresAt: expiresAt ?? null,
    createdAt: now,
  };
}

export function getCredentialsByWallet(walletId: string): Credential[] {
  const db = getDatabase();
  const result = db.execute(
    'SELECT * FROM credential WHERE wallet_id = ? ORDER BY created_at DESC',
    [walletId],
  );
  return result.rows.map(mapRowToCredential);
}

export function getCredentialById(id: string): Credential | null {
  const db = getDatabase();
  const result = db.execute('SELECT * FROM credential WHERE id = ?', [id]);
  return result.rows.length > 0 ? mapRowToCredential(result.rows[0]) : null;
}

export function updateCredentialStatus(
  id: string,
  status: CredentialStatus,
): void {
  const db = getDatabase();
  db.execute('UPDATE credential SET status = ? WHERE id = ?', [status, id]);
}

export function deleteCredential(id: string): void {
  const db = getDatabase();
  db.execute('DELETE FROM credential WHERE id = ?', [id]);
}

function mapRowToCredential(row: Record<string, unknown>): Credential {
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
    rawJwt: row.raw_jwt as string,
    format: (row.format as CredentialFormat) ?? DEFAULT_CREDENTIAL_FORMAT,
    issuerDid: row.issuer_did as string | null,
    issuerName: row.issuer_name as string | null,
    credentialType: row.credential_type as string | null,
    displayName: row.display_name as string | null,
    displayImage: row.display_image as string | null,
    status: (row.status as CredentialStatus) ?? CredentialStatus.Unverified,
    issuedAt: row.issued_at as number | null,
    expiresAt: row.expires_at as number | null,
    createdAt: row.created_at as number,
  };
}
