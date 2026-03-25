'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    const user = await db.getUserByEmail(email)
    if (!user) {
        return { error: 'Invalid email or password' }
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
        return { error: 'Invalid email or password' }
    }

    await createSession(user.id)
    redirect('/')
}
