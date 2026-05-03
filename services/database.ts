import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let dbPromise: Promise<SQLiteDatabase> | null = null;

const MOCK_DB = {
  getAllAsync: async <T>(): Promise<T[]> => [],
  getFirstAsync: async <T>(): Promise<T | null> => null,
  runAsync: async (): Promise<{ lastInsertRowId: number; changes: number }> => ({ lastInsertRowId: 0, changes: 0 }),
  execAsync: async (): Promise<void> => {},
} as unknown as SQLiteDatabase;

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = init();
  }
  return dbPromise;
}

async function init(): Promise<SQLiteDatabase> {
  try {
    const db = await openDatabaseAsync('hermes.db');
    await initSchema(db);
    return db;
  } catch (e) {
    console.warn('SQLite init failed (browser may not support OPFS), using mock DB:', e);
    return MOCK_DB;
  }
}

async function initSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('checking','savings','investment')),
      balance REAL NOT NULL DEFAULT 0,
      number TEXT,
      icon TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense','income')),
      icon TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS recurring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('expense','income')),
      category_id INTEGER,
      frequency TEXT NOT NULL CHECK(frequency IN ('monthly','weekly','yearly')),
      start_date TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('expense','income')),
      category_id INTEGER,
      account_id INTEGER,
      date TEXT NOT NULL,
      recurring_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (recurring_id) REFERENCES recurring(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      name TEXT,
      shares REAL NOT NULL CHECK(shares > 0),
      avg_cost REAL NOT NULL CHECK(avg_cost > 0),
      current_price REAL,
      price_updated_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lender TEXT,
      original_amount REAL,
      remaining REAL NOT NULL CHECK(remaining >= 0),
      interest_rate REAL NOT NULL CHECK(interest_rate >= 0),
      monthly_payment REAL NOT NULL CHECK(monthly_payment > 0),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS annual_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      category_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await runMigrations(db);
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const applied = await db.getAllAsync<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version', []);
  const appliedVersions = new Set(applied.map(r => r.version));

  if (!appliedVersions.has(1)) {
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('positions')", []);
    const hasCurrentPrice = cols.some(c => c.name === 'current_price');
    if (!hasCurrentPrice) {
      await db.execAsync("ALTER TABLE positions ADD COLUMN current_price REAL");
      await db.execAsync("ALTER TABLE positions ADD COLUMN price_updated_at TEXT");
    }
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (1)', []);
  }

  if (!appliedVersions.has(2)) {
    await db.runAsync('INSERT OR IGNORE INTO settings (key, value) VALUES (\'theme\', \'system\')', []);
    await db.runAsync('INSERT OR IGNORE INTO settings (key, value) VALUES (\'currency\', \'USD\')', []);
    await db.runAsync('INSERT OR IGNORE INTO settings (key, value) VALUES (\'currency_symbol\', \'$\')', []);
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (2)', []);
  }

  if (!appliedVersions.has(3)) {
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('annual_expenses')", []);
    if (cols.length === 0) {
      await db.execAsync(`
        CREATE TABLE annual_expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL CHECK(amount > 0),
          category_id INTEGER,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );
      `);
    }
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (3)', []);
  }

  if (!appliedVersions.has(4)) {
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('loans')", []);
    if (!cols.some(c => c.name === 'last_payment_month')) {
      await db.execAsync("ALTER TABLE loans ADD COLUMN last_payment_month TEXT");
    }
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (4)', []);
  }

  if (!appliedVersions.has(5)) {
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('loans')", []);
    if (!cols.some(c => c.name === 'portion')) {
      await db.execAsync("ALTER TABLE loans ADD COLUMN portion REAL DEFAULT 100");
    }
    await db.runAsync('INSERT INTO schema_migrations (version) VALUES (5)', []);
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS recurring;
    DROP TABLE IF EXISTS positions;
    DROP TABLE IF EXISTS loans;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS categories;
  `);
  await initSchema(db);
}
