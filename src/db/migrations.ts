import type {Database} from './database';

interface Migration {
  version: number;
  up: (db: Database) => void;
}

// SQLite throws when ADD COLUMN targets an existing column. Some legacy
// installs ended up with the tables already carrying these columns (previous
// `initTables` created them eagerly) while `user_version` stayed behind; in
// that case re-running the migration would abort boot. Swallow the specific
// "duplicate column" error so migrations stay idempotent.
function addColumnIfMissing(db: Database, sql: string): void {
  try {
    db.execute(sql);
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? '').toLowerCase();
    if (msg.includes('duplicate column')) {
      return;
    }
    throw err;
  }
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
  {
    version: 2,
    up: db => {
      addColumnIfMissing(
        db,
        `ALTER TABLE credential ADD COLUMN format TEXT NOT NULL DEFAULT 'sd-jwt-vcdm'`,
      );
    },
  },
  {
    version: 3,
    up: db => {
      db.execute(`CREATE TABLE IF NOT EXISTS issuer_trust (
        did TEXT PRIMARY KEY,
        org_json TEXT NOT NULL,
        status INTEGER NOT NULL DEFAULT 1,
        updated_at INTEGER,
        fetched_at INTEGER NOT NULL
      )`);
      db.execute(`CREATE TABLE IF NOT EXISTS kv_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )`);
    },
  },
  {
    version: 4,
    up: db => {
      addColumnIfMissing(
        db,
        `ALTER TABLE wallet ADD COLUMN pin_failure_count INTEGER NOT NULL DEFAULT 0`,
      );
      addColumnIfMissing(
        db,
        `ALTER TABLE wallet ADD COLUMN pin_failure_at INTEGER NOT NULL DEFAULT 0`,
      );
    },
  },
  {
    version: 5,
    up: db => {
      // Store PBKDF2 iteration count per-wallet so existing PIN hashes keep
      // working after we raise the default for new PINs.
      addColumnIfMissing(
        db,
        `ALTER TABLE wallet ADD COLUMN pin_iterations INTEGER NOT NULL DEFAULT 100000`,
      );
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

export const LATEST_MIGRATION_VERSION =
  migrations[migrations.length - 1].version;
