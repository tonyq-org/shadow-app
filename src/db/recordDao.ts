import {v4 as uuidv4} from 'uuid';
import {getDatabase} from './database';

export type OperationType = 'add' | 'remove' | 'verify' | 'present' | 'login' | 'changePassword' | 'expired';

export interface OperationRecord {
  id: string;
  walletId: string;
  type: OperationType;
  detail: string | null;
  createdAt: number;
}

export interface PresentationRecord {
  id: string;
  walletId: string;
  verifierName: string | null;
  credentialIds: string[];
  result: number;
  createdAt: number;
}

export function addOperationRecord(
  walletId: string,
  type: OperationType,
  detail?: string,
): void {
  const db = getDatabase();
  db.execute(
    'INSERT INTO operation_record (id, wallet_id, type, detail, created_at) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), walletId, type, detail ?? null, Date.now()],
  );
}

export function getOperationRecords(walletId: string): OperationRecord[] {
  const db = getDatabase();
  const result = db.execute(
    'SELECT * FROM operation_record WHERE wallet_id = ? ORDER BY created_at DESC',
    [walletId],
  );
  return result.rows.map(row => ({
    id: row.id as string,
    walletId: row.wallet_id as string,
    type: row.type as OperationType,
    detail: row.detail as string | null,
    createdAt: row.created_at as number,
  }));
}

export function addPresentationRecord(
  walletId: string,
  verifierName: string | null,
  credentialIds: string[],
  result: number,
): void {
  const db = getDatabase();
  db.execute(
    'INSERT INTO presentation_record (id, wallet_id, verifier_name, credential_ids, result, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), walletId, verifierName, JSON.stringify(credentialIds), result, Date.now()],
  );
}

export function getPresentationRecords(walletId: string): PresentationRecord[] {
  const db = getDatabase();
  const result = db.execute(
    'SELECT * FROM presentation_record WHERE wallet_id = ? ORDER BY created_at DESC',
    [walletId],
  );
  return result.rows.map(row => ({
    id: row.id as string,
    walletId: row.wallet_id as string,
    verifierName: row.verifier_name as string | null,
    credentialIds: JSON.parse((row.credential_ids as string) ?? '[]'),
    result: row.result as number,
    createdAt: row.created_at as number,
  }));
}
