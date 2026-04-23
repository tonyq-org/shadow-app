import {open, type DB} from '@op-engineering/op-sqlite';
import * as Keychain from 'react-native-keychain';
import {randomBytes, bytesToHex} from '@noble/hashes/utils.js';
import {runMigrations, LATEST_MIGRATION_VERSION} from './migrations';

export interface Database {
  execute(sql: string, params?: unknown[]): {rows: Record<string, unknown>[]};
  executeBatch(commands: Array<{sql: string; params?: unknown[]}>): void;
}

const KEYCHAIN_SERVICE = 'shadow-wallet-db-key';
const DB_NAME = 'shadow_wallet.db';

let rawDb: DB | null = null;

export class DatabaseUnlockError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseUnlockError';
  }
}

async function getOrCreateDbKey(): Promise<{key: string; freshlyCreated: boolean}> {
  const existing = await Keychain.getGenericPassword({service: KEYCHAIN_SERVICE});
  if (existing && existing.password) {
    return {key: existing.password, freshlyCreated: false};
  }
  const key = bytesToHex(randomBytes(32));
  await Keychain.setGenericPassword('db', key, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return {key, freshlyCreated: true};
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
  const {key, freshlyCreated} = await getOrCreateDbKey();
  try {
    rawDb = open({name: DB_NAME, encryptionKey: key});
    rawDb.executeSync('SELECT count(*) FROM sqlite_master');
  } catch (err) {
    try {
      rawDb?.close();
    } catch {}
    rawDb = null;
    if (freshlyCreated) {
      // First-run path: the Keychain key was just minted but a stale plaintext
      // or differently-keyed DB file exists from a previous install. Safe to
      // recreate — there is nothing the user could lose.
      const temp = open({name: DB_NAME});
      temp.delete();
      rawDb = open({name: DB_NAME, encryptionKey: key});
    } else {
      // Keychain had a key but it can't unlock the DB. Either the DB file was
      // replaced (restore, sideload) or the key was rotated out of band. Do
      // NOT silently delete user data — surface the error and let the caller
      // decide (show error screen, offer wipe-and-reinit with confirmation).
      throw new DatabaseUnlockError(
        'Existing wallet database cannot be unlocked with the current Keychain key.',
        err,
      );
    }
  }
  const db = wrapDb(rawDb);
  const preExistingWallet = walletTableExists(db);
  initTables(db);
  applyMigrations(db, preExistingWallet);
}

function walletTableExists(db: Database): boolean {
  const rows = db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='wallet'`,
  ).rows;
  return rows.length > 0;
}

/**
 * Escape hatch for the unlock-failure recovery UI: deletes the DB file and the
 * Keychain entry, then re-initializes from scratch. Destroys ALL wallet data —
 * callers MUST confirm with the user before invoking.
 */
export async function resetDatabaseHard(): Promise<void> {
  try {
    rawDb?.close();
  } catch {}
  rawDb = null;
  try {
    const temp = open({name: DB_NAME});
    temp.delete();
  } catch {}
  try {
    await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
  } catch {}
}

function applyMigrations(db: Database, preExistingWallet: boolean): void {
  const row = db.execute('PRAGMA user_version').rows[0];
  const raw = row ? (row.user_version as number | undefined) : 0;

  // Fresh install: `initTables` just created every table with the latest
  // schema, so jump straight to the head version and skip all migrations.
  // Without this, v0 would be treated as v1 and v4/v5 would try to re-ALTER
  // columns that initTables already created, failing with "duplicate column".
  if (!preExistingWallet && (!raw || raw === 0)) {
    db.execute(`PRAGMA user_version = ${LATEST_MIGRATION_VERSION}`);
    return;
  }

  // Legacy install at user_version=0 is treated as v1 (earliest schema).
  const current = raw && raw > 0 ? raw : 1;
  const next = runMigrations(db, current);
  if (next !== current) {
    db.execute(`PRAGMA user_version = ${next}`);
  }
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
      pin_failure_count INTEGER NOT NULL DEFAULT 0,
      pin_failure_at INTEGER NOT NULL DEFAULT 0,
      pin_iterations INTEGER NOT NULL DEFAULT 100000,
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
