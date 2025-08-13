import { getDb } from '../utils/db'

export function ensureOwner(name: string) {
    const db = getDb()
    const found = db.prepare('SELECT id FROM owners WHERE name = ?').get(name) as { id: number } | undefined
    if (found) return found.id as number
    const info = db.prepare('INSERT INTO owners (name) VALUES (?)').run(name)
    return Number(info.lastInsertRowid)
}