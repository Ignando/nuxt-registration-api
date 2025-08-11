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

export default database