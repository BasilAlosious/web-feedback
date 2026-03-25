'use client'

import { useFormStatus } from 'react-dom'
import { signup } from './actions'
import { useState } from 'react'
import Link from 'next/link'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            className="btn-action-primary w-full"
            disabled={pending}
        >
            {pending ? '[...] Creating Account' : '[+] Sign Up'}
        </button>
    )
}

export default function SignupPage() {
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        const result = await signup(formData)
        if (result?.error) {
            setError(result.error)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-sm">
                {/* Status Widget Header */}
                <div className="status-widget h-24 mb-8">
                    <div className="status-widget-header">[ FEEDBACK_2.0 ]</div>
                </div>

                {/* Signup Card */}
                <div className="border border-border bg-card">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border">
                        <h1 className="font-mono text-sm uppercase font-medium">
                            Create Account
                        </h1>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                            Enter your details to get started
                        </p>
                    </div>

                    {/* Form */}
                    <form action={handleSubmit} className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your name"
                                    required
                                    className="w-full bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Min 8 characters"
                                    required
                                    minLength={8}
                                    className="w-full bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-destructive font-mono text-xs">
                                    <span>[!]</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <SubmitButton />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <Link href="/login" className="font-mono text-xs text-muted-foreground hover:text-foreground">
                        Already have an account? <span className="text-foreground">[→] Login</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
