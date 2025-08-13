import { createUser } from '..'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    if (!body?.name || !body?.email || !body?.password) {
        throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
    }
    const id = createUser(body.name, body.email, body.password, body.role === 'admin' ? 'admin' : 'user')
    return { success: true, id }
})