import type {Database} from './database';

interface Migration {
  version: number;
  up: (db: Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: db => {
      db.execute(`CREATE TABLE IF NOT EXISTS wallet (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        did_document TEXT,
        public_key_jwk TEXT,
        auto_logout_minutes INTEGER DEFAULT 5,
        created_at INTEGER NOT NULL
      )`);
      db.execute(`CREATE TABLE IF NOT EXISTS credential (
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
      )`);
      db.execute(`CREATE TABLE IF NOT EXISTS operation_record (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        type TEXT NOT NULL,
        detail TEXT,
        created_at INTEGER NOT NULL
      )`);
      db.execute(`CREATE TABLE IF NOT EXISTS presentation_record (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        verifier_name TEXT,
        credential_ids TEXT,
        result INTEGER,
        created_at INTEGER NOT NULL
      )`);
      db.execute(`CREATE TABLE IF NOT EXISTS search_record (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`);
    },
  },
];

export function runMigrations(db: Database, currentVersion: number): number {
  let version = currentVersion;
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      migration.up(db);
      version = migration.version;
    }
  }
  return version;
}
