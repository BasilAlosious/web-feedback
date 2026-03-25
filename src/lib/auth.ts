import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db, User } from './db'
import crypto from 'crypto'

const SESSION_COOKIE = 'session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production'

// Sign a payload using HMAC-SHA256
function sign(payload: string): string {
    const signature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(payload)
        .digest('hex')
    return `${payload}.${signature}`
}

// Verify a signed token and return the payload if valid
function verify(token: string): string | null {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [payload, signature] = parts
    const expected = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(payload)
        .digest('hex')
    if (signature !== expected) return null
    return payload
}

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

// Create a session cookie for a user
export async function createSession(userId: string): Promise<void> {
    const payload = JSON.stringify({
        userId,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    const token = sign(Buffer.from(payload).toString('base64'))

    ;(await cookies()).set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
    })
}

// Get the current session from the cookie
export async function getSession(): Promise<{ userId: string } | null> {
    const cookie = (await cookies()).get(SESSION_COOKIE)
    if (!cookie?.value) return null

    const payload = verify(cookie.value)
    if (!payload) return null

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64').toString())
        if (data.exp < Date.now()) return null
        return { userId: data.userId }
    } catch {
        return null
    }
}

// Get the current authenticated user
export async function getCurrentUser(): Promise<User | null> {
    const session = await getSession()
    if (!session) return null
    const user = await db.getUserById(session.userId)
    return user ?? null
}

// Destroy the session cookie
export async function destroySession(): Promise<void> {
    ;(await cookies()).delete(SESSION_COOKIE)
}
