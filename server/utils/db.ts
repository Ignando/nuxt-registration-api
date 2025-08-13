import Database from 'better-sqlite3'
import { join } from 'path'

const database = new Database(join(process.cwd(), 'users.db'))

database.exec(`
CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS complexes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER,
  UNIQUE(name, owner_id),
  FOREIGN KEY(owner_id) REFERENCES owners(id)
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utility_type TEXT NOT NULL CHECK(utility_type IN ('water','electricity','gas')),
  amount REAL NOT NULL,
  complex_id INTEGER NOT NULL,
  meter_number TEXT,
  owner_id INTEGER,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(complex_id) REFERENCES complexes(id),
  FOREIGN KEY(owner_id) REFERENCES owners(id)
);
CREATE INDEX IF NOT EXISTS idx_txn_complex ON transactions(complex_id);
CREATE INDEX IF NOT EXISTS idx_txn_owner ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_txn_utility ON transactions(utility_type);
CREATE INDEX IF NOT EXISTS idx_txn_meter ON transactions(meter_number);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','user')) DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS imports (
  import_id TEXT PRIMARY KEY,
  filename TEXT,
  sheet TEXT,
  started_at TEXT,
  finished_at TEXT,
  rows_received INTEGER,
  inserted INTEGER,
  updated INTEGER,
  failed INTEGER,
  dry_run INTEGER,
  report_json TEXT
);
`)

export function getDb() { return db }

export type TxnFilters = {
  utility_type?: 'water' | 'electricity' | 'gas'
  min_amount?: number
  max_amount?: number
  complex_id?: number
  owner_id?: number
  meter_search?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}




export default database