'use client'

import { useFormStatus } from 'react-dom'
import { login } from './actions'
import { useState } from 'react'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            className="btn-action-primary w-full"
            disabled={pending}
        >
            {pending ? '[...] Authenticating' : '[→] Login'}
        </button>
    )
}

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        const result = await login(formData)
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

                {/* Login Card */}
                <div className="border border-border bg-card">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border">
                        <h1 className="font-mono text-sm uppercase font-medium">
                            Agency Login
                        </h1>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                            Enter credentials to access the system
                        </p>
                    </div>

                    {/* Form */}
                    <form action={handleSubmit} className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
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
                    <span className="font-mono text-xs text-muted-foreground">
                        <span className="text-foreground">[?]</span> Contact admin for access
                    </span>
                </div>
            </div>
        </div>
    )
}
