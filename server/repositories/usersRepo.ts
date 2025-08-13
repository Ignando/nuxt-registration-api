import { getDb } from '../utils/db'
import bcrypt from 'bcryptjs'

type UserRow = {
    id: number
    name: string
    role: string
    email: string
    password_hash: string
}

export function createUser(name: string, email: string, password: string, role: 'admin' | 'user' = 'user') {
    const db = getDb()
    const hash = bcrypt.hashSync(password, 10)
    const info = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)').run(name, email, hash, role)
    return Number(info.lastInsertRowid)
}

export function verifyUser(email: string, password: string) {
    const db = getDb()
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined
    if (!row) return null
    const ok = bcrypt.compareSync(password, row.password_hash)
    if (!ok) return null
    return { id: row.id, name: row.name, role: row.role, email: row.email }
}