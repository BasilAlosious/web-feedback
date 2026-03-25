'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export async function signup(formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validation
    if (!name || !email || !password) {
        return { error: 'All fields are required' }
    }

    if (name.trim().length < 2) {
        return { error: 'Name must be at least 2 characters' }
    }

    if (!email.includes('@') || !email.includes('.')) {
        return { error: 'Invalid email address' }
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' }
    }

    // Check if user already exists
    const existing = await db.getUserByEmail(email)
    if (existing) {
        return { error: 'An account with this email already exists' }
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await db.createUser({
        id: Math.random().toString(36).substring(2, 9),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
    })

    // Create session and redirect
    await createSession(user.id)
    redirect('/')
}
