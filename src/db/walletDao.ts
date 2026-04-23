import {v4 as uuidv4} from 'uuid';
import {getDatabase} from './database';
import type {Wallet} from '../store/walletStore';

export function createWallet(
  name: string,
  pinHash: string,
  pinSalt: string,
): Wallet {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.execute(
    'INSERT INTO wallet (id, name, pin_hash, pin_salt, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, name, pinHash, pinSalt, now],
  );

  return {
    id,
    name,
    pinHash,
    pinSalt,
    didDocument: null,
    publicKeyJwk: null,
    autoLogoutMinutes: 5,
    biometricEnabled: false,
    pinFailureCount: 0,
    pinFailureAt: 0,
    createdAt: now,
  };
}

export function getWallets(): Wallet[] {
  const db = getDatabase();
  const result = db.execute('SELECT * FROM wallet ORDER BY created_at DESC');
  return result.rows.map(mapRowToWallet);
}

export function getWalletById(id: string): Wallet | null {
  const db = getDatabase();
  const result = db.execute('SELECT * FROM wallet WHERE id = ?', [id]);
  return result.rows.length > 0 ? mapRowToWallet(result.rows[0]) : null;
}

export function updateWalletDID(
  id: string,
  didDocument: string,
  publicKeyJwk: string,
): void {
  const db = getDatabase();
  db.execute(
    'UPDATE wallet SET did_document = ?, public_key_jwk = ? WHERE id = ?',
    [didDocument, publicKeyJwk, id],
  );
}

export function updateWalletName(id: string, name: string): void {
  const db = getDatabase();
  db.execute('UPDATE wallet SET name = ? WHERE id = ?', [name, id]);
}

export function updateAutoLogout(id: string, minutes: number): void {
  const db = getDatabase();
  db.execute('UPDATE wallet SET auto_logout_minutes = ? WHERE id = ?', [
    minutes,
    id,
  ]);
}

export function updatePin(id: string, pinHash: string, pinSalt: string): void {
  const db = getDatabase();
  db.execute('UPDATE wallet SET pin_hash = ?, pin_salt = ? WHERE id = ?', [
    pinHash,
    pinSalt,
    id,
  ]);
}

export function updateBiometricEnabled(id: string, enabled: boolean): void {
  const db = getDatabase();
  db.execute('UPDATE wallet SET biometric_enabled = ? WHERE id = ?', [
    enabled ? 1 : 0,
    id,
  ]);
}

export function recordPinFailure(id: string): {count: number; at: number} {
  const db = getDatabase();
  const now = Date.now();
  db.execute(
    'UPDATE wallet SET pin_failure_count = pin_failure_count + 1, pin_failure_at = ? WHERE id = ?',
    [now, id],
  );
  const row = db
    .execute('SELECT pin_failure_count FROM wallet WHERE id = ?', [id])
    .rows[0];
  return {count: (row?.pin_failure_count as number) ?? 0, at: now};
}

export function resetPinFailures(id: string): void {
  const db = getDatabase();
  db.execute(
    'UPDATE wallet SET pin_failure_count = 0, pin_failure_at = 0 WHERE id = ?',
    [id],
  );
}

export function deleteWallet(id: string): void {
  const db = getDatabase();
  db.execute('DELETE FROM credential WHERE wallet_id = ?', [id]);
  db.execute('DELETE FROM operation_record WHERE wallet_id = ?', [id]);
  db.execute('DELETE FROM presentation_record WHERE wallet_id = ?', [id]);
  db.execute('DELETE FROM search_record WHERE wallet_id = ?', [id]);
  db.execute('DELETE FROM wallet WHERE id = ?', [id]);
}

function mapRowToWallet(row: Record<string, unknown>): Wallet {
  return {
    id: row.id as string,
    name: row.name as string,
    pinHash: row.pin_hash as string,
    pinSalt: (row.pin_salt as string) ?? '',
    didDocument: row.did_document as string | null,
    publicKeyJwk: row.public_key_jwk as string | null,
    autoLogoutMinutes: (row.auto_logout_minutes as number) ?? 5,
    biometricEnabled: (row.biometric_enabled as number) === 1,
    pinFailureCount: (row.pin_failure_count as number) ?? 0,
    pinFailureAt: (row.pin_failure_at as number) ?? 0,
    createdAt: row.created_at as number,
  };
}
