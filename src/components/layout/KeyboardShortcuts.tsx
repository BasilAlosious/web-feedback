"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function KeyboardShortcuts() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            // Don't trigger shortcuts when modifier keys are pressed (except for special cases)
            if (e.metaKey || e.ctrlKey || e.altKey) {
                return
            }

            // Global navigation shortcuts
            switch (e.key.toLowerCase()) {
                case 'd':
                    e.preventDefault()
                    router.push('/')
                    break
                case 'f':
                    // Only trigger global navigation if we're not in a project view
                    // (project views have their own [F] for fullscreen)
                    if (!pathname.includes('/projects/')) {
                        e.preventDefault()
                        router.push('/feedback')
                    }
                    break
                case 'p':
                    e.preventDefault()
                    router.push('/projects')
                    break
                case 's':
                    e.preventDefault()
                    router.push('/settings')
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [router, pathname])

    return null // This component doesn't render anything
}
