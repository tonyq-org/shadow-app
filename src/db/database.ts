import {open, type DB} from '@op-engineering/op-sqlite';
import * as Keychain from 'react-native-keychain';
import {randomBytes, bytesToHex} from '@noble/hashes/utils.js';

export interface Database {
  execute(sql: string, params?: unknown[]): {rows: Record<string, unknown>[]};
  executeBatch(commands: Array<{sql: string; params?: unknown[]}>): void;
}

const KEYCHAIN_SERVICE = 'shadow-wallet-db-key';
const DB_NAME = 'shadow_wallet.db';

let rawDb: DB | null = null;

async function getOrCreateDbKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({service: KEYCHAIN_SERVICE});
  if (existing && existing.password) {
    return existing.password;
  }
  const key = bytesToHex(randomBytes(32));
  await Keychain.setGenericPassword('db', key, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

function wrapDb(raw: DB): Database {
  return {
    execute(sql: string, params?: unknown[]) {
      const result = raw.executeSync(sql, params as any[]);
      return {rows: result.rows as Record<string, unknown>[]};
    },
    executeBatch(commands) {
      for (const cmd of commands) {
        raw.executeSync(cmd.sql, cmd.params as any[]);
      }
    },
  };
}

export function getDatabase(): Database {
  if (!rawDb) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return wrapDb(rawDb);
}

export async function initDatabase(): Promise<void> {
  if (rawDb) {
    return;
  }
  const key = await getOrCreateDbKey();
  try {
    rawDb = open({name: DB_NAME, encryptionKey: key});
    rawDb.executeSync('SELECT count(*) FROM sqlite_master');
  } catch {
    try {
      rawDb?.close();
    } catch {}
    const temp = open({name: DB_NAME});
    temp.delete();
    rawDb = open({name: DB_NAME, encryptionKey: key});
  }
  initTables(wrapDb(rawDb));
}

function initTables(db: Database): void {
  db.execute(`
    CREATE TABLE IF NOT EXISTS wallet (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      pin_salt TEXT NOT NULL DEFAULT '',
      did_document TEXT,
      public_key_jwk TEXT,
      auto_logout_minutes INTEGER DEFAULT 5,
      biometric_enabled INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS credential (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL,
      raw_jwt TEXT NOT NULL,
      issuer_did TEXT,
      issuer_name TEXT,
      credential_type TEXT,
      display_name TEXT,
      display_image TEXT,
      status INTEGER DEFAULT 0,
      issued_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS operation_record (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL,
      type TEXT NOT NULL,
      detail TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS presentation_record (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL,
      verifier_name TEXT,
      credential_ids TEXT,
      result INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS search_record (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
}

export async function closeDatabase(): Promise<void> {
  if (rawDb) {
    rawDb.close();
    rawDb = null;
  }
}
