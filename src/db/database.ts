type Row = Record<string, unknown>;

interface Table {
  columns: string[];
  rows: Row[];
}

const tables: Record<string, Table> = {};

export interface Database {
  execute(sql: string, params?: unknown[]): {rows: Row[]};
  executeBatch(commands: Array<{sql: string; params?: unknown[]}>): void;
}

const inMemoryDb: Database = {
  execute(sql: string, params?: unknown[]): {rows: Row[]} {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('CREATE TABLE')) {
      const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match && !tables[match[1]]) {
        tables[match[1]] = {columns: [], rows: []};
      }
      return {rows: []};
    }

    if (trimmed.startsWith('INSERT')) {
      const match = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)/i);
      if (match) {
        const tableName = match[1];
        const columns = match[2].split(',').map(c => c.trim());
        const table = tables[tableName];
        if (table) {
          const row: Row = {};
          columns.forEach((col, i) => {
            row[col] = params?.[i] ?? null;
          });
          table.rows.push(row);
        }
      }
      return {rows: []};
    }

    if (trimmed.startsWith('SELECT')) {
      const fromMatch = sql.match(/FROM (\w+)/i);
      if (!fromMatch) {
        return {rows: []};
      }
      const tableName = fromMatch[1];
      const table = tables[tableName];
      if (!table) {
        return {rows: []};
      }

      let result = [...table.rows];

      const whereMatch = sql.match(/WHERE (\w+)\s*=\s*\?/i);
      if (whereMatch && params && params.length > 0) {
        const col = whereMatch[1];
        result = result.filter(r => r[col] === params[0]);
      }

      if (trimmed.includes('ORDER BY') && trimmed.includes('DESC')) {
        const orderMatch = sql.match(/ORDER BY (\w+)/i);
        if (orderMatch) {
          const col = orderMatch[1];
          result.sort((a, b) => (Number(b[col]) || 0) - (Number(a[col]) || 0));
        }
      }

      return {rows: result};
    }

    if (trimmed.startsWith('UPDATE')) {
      const match = sql.match(/UPDATE (\w+)\s+SET\s+(.+?)\s+WHERE\s+(\w+)\s*=\s*\?/i);
      if (match && params) {
        const tableName = match[1];
        const setClauses = match[2];
        const whereCol = match[3];
        const table = tables[tableName];
        if (table) {
          const sets = setClauses.split(',').map(s => s.trim().match(/(\w+)\s*=\s*\?/)?.[1]).filter(Boolean) as string[];
          const whereVal = params[sets.length];
          table.rows.forEach(row => {
            if (row[whereCol] === whereVal) {
              sets.forEach((col, i) => {
                row[col] = params[i] ?? null;
              });
            }
          });
        }
      }
      return {rows: []};
    }

    if (trimmed.startsWith('DELETE')) {
      const match = sql.match(/DELETE FROM (\w+)\s+WHERE\s+(\w+)\s*=\s*\?/i);
      if (match && params) {
        const tableName = match[1];
        const whereCol = match[2];
        const table = tables[tableName];
        if (table) {
          table.rows = table.rows.filter(r => r[whereCol] !== params[0]);
        }
      }
      return {rows: []};
    }

    return {rows: []};
  },

  executeBatch(commands) {
    for (const cmd of commands) {
      this.execute(cmd.sql, cmd.params);
    }
  },
};

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    db = inMemoryDb;
    initTables();
  }
  return db;
}

export async function initDatabase(_encryptionKey?: string): Promise<void> {
  db = inMemoryDb;
  initTables();
}

function initTables(): void {
  const tableNames = ['wallet', 'credential', 'operation_record', 'presentation_record', 'search_record'];
  for (const name of tableNames) {
    if (!tables[name]) {
      tables[name] = {columns: [], rows: []};
    }
  }
}

export async function closeDatabase(): Promise<void> {
  db = null;
}
