import { getDb } from '../utils/db'

export function ensureComplex(name: string, owner_id?: number) {
    const db = getDb()
    const found = db.prepare('SELECT id FROM complexes WHERE name = ? AND ifnull(owner_id,0) = ifnull(?,0)').get(name, owner_id ?? null) as { id: number } | undefined
    if (found) return found.id as number
    const info = db.prepare('INSERT INTO complexes (name, owner_id) VALUES (?, ?)').run(name, owner_id ?? null)
    return Number(info.lastInsertRowid)
}