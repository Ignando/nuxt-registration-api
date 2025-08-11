import database from "../utils/db"

/**
 * Exposes a list of registered users via GET /api/users
 * Only returns public fields (name and email).
 */

export default defineEventHandler(() => {
    const users = database.prepare('SELECT name, email FROM users').all()
    return users
})
