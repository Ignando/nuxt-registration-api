import Database from 'better-sqlite3'
import { join } from 'path'

const database = new Database(join(process.cwd(), 'users.db'))

database.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`).run()

database.prepare(`CREATE TABLE IF NOT EXSTS (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_time TEXT NOT NULL,
  meter_number INTEGER NOT NULL,
  token INTEGER NOT NULL UNIQUE,
  utility_type TEXT NOT NULL,
  complex TEXT NOT NULL,
  value_of_purchase INTEGER NOT NULL,
  owner_id, STRING NOT NULL,
  )
  `).run()

export default database