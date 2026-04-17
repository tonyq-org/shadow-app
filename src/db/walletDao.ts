import {v4 as uuidv4} from 'uuid';
import {getDatabase} from './database';
import type {Wallet} from '../store/walletStore';

export function createWallet(
  name: string,
  pinHash: string,
): Wallet {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.execute(
    'INSERT INTO wallet (id, name, pin_hash, created_at) VALUES (?, ?, ?, ?)',
    [id, name, pinHash, now],
  );

  return {
    id,
    name,
    pinHash,
    didDocument: null,
    publicKeyJwk: null,
    autoLogoutMinutes: 5,
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
    didDocument: row.did_document as string | null,
    publicKeyJwk: row.public_key_jwk as string | null,
    autoLogoutMinutes: (row.auto_logout_minutes as number) ?? 5,
    createdAt: row.created_at as number,
  };
}
