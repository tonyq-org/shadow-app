// Database initialization using react-native-quick-sqlite
// TODO: Install and configure react-native-quick-sqlite + SQLCipher when building native

const DB_NAME = 'ShadowWallet_Secret';

export interface Database {
  execute(sql: string, params?: unknown[]): {rows: Record<string, unknown>[]};
  executeBatch(commands: Array<{sql: string; params?: unknown[]}>): void;
}

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(encryptionKey: string): Promise<void> {
  // TODO: Replace with actual react-native-quick-sqlite initialization
  // import { open } from 'react-native-quick-sqlite';
  // db = open({ name: DB_NAME, encryptionKey });

  // Placeholder for development
  console.log('Database initialized with encryption');

  await createTables();
}

async function createTables(): Promise<void> {
  const database = getDatabase();

  database.executeBatch([
    {
      sql: `CREATE TABLE IF NOT EXISTS wallet (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        did_document TEXT,
        public_key_jwk TEXT,
        auto_logout_minutes INTEGER DEFAULT 5,
        created_at INTEGER NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS credential (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL REFERENCES wallet(id),
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
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS operation_record (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        type TEXT NOT NULL,
        detail TEXT,
        created_at INTEGER NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS presentation_record (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        verifier_name TEXT,
        credential_ids TEXT,
        result INTEGER,
        created_at INTEGER NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS search_record (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`,
    },
  ]);
}

export async function closeDatabase(): Promise<void> {
  db = null;
}
