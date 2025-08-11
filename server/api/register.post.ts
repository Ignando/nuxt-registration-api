import { H3Event, readBody } from 'h3'
import bcrypt from 'bcrypt'
import database from '../utils/db'

/**
 * User interface defining the structure of a user object.
 */
interface User {
    name: string
    email: string
    password: string
}


/**
 * Handles user registration via POST /api/register
 * Validates input, hashes the password, and stores the user.
 */
export default defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event)
    const errors: Record<string, string> = {}

    if (!body.name || body.name.length < 3) {
        errors.name = 'Name must be at least 3 characters'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!body.email || !emailRegex.test(body.email)) {
        errors.email = 'Email is invalid'
    }

    if (!body.password || body.password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
    }

    if (Object.keys(errors).length > 0) {
        return {
            success: false,
            message: 'Invalid input',
            errors,
        }
    }

    // Prevent duplicate registrations
    const existingUser = database
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(body.email)


    if (existingUser) {
        return {
            success: false,
            message: 'Email is already registerd',
            errors: { email: 'This email is already in use' },
        }
    }
    // Hash the password 
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // Persist the user 
    database.prepare(`
        INSERT INTO users (name, email, password)
        VALUES (?,?,?)
        `
    ).run(body.name, body.email, hashedPassword)

    return {
        success: true,
        message: 'User registered successfully',
    }
})
