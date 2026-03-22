"use client"

import { useEffect, useState } from "react"
import { Agentation, type Annotation } from "agentation"

interface AgentationProviderProps {
    children: React.ReactNode
}

export function AgentationProvider({ children }: AgentationProviderProps) {
    const [isEnabled, setIsEnabled] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Check development mode - this is inlined at build time by Next.js
    const isDevelopment = process.env.NODE_ENV === 'development'

    useEffect(() => {
        setMounted(true)
        if (!isDevelopment) return

        // Keyboard shortcut to toggle: Ctrl+Shift+A (or Cmd+Shift+A on Mac)
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd/Ctrl + Shift + A (case insensitive)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault()
                setIsEnabled(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isDevelopment])

    const handleAnnotationAdd = (annotation: Annotation) => {
        console.log('[Agentation] Annotation added:', annotation)
    }

    const handleAnnotationDelete = (annotation: Annotation) => {
        console.log('[Agentation] Annotation deleted:', annotation)
    }

    const handleAnnotationUpdate = (annotation: Annotation) => {
        console.log('[Agentation] Annotation updated:', annotation)
    }

    const handleCopy = (markdown: string) => {
        console.log('[Agentation] Copied to clipboard')
        console.log(markdown)
    }

    const handleSubmit = (output: string, annotations: Annotation[]) => {
        console.log('[Agentation] Submitted annotations:')
        console.log(output)
        console.log('Annotations:', annotations)
    }

    // Only show in development mode
    if (!isDevelopment) {
        return <>{children}</>
    }

    return (
        <>
            {children}
            {isEnabled && (
                <Agentation
                    onAnnotationAdd={handleAnnotationAdd}
                    onAnnotationDelete={handleAnnotationDelete}
                    onAnnotationUpdate={handleAnnotationUpdate}
                    onCopy={handleCopy}
                    onSubmit={handleSubmit}
                    copyToClipboard={true}
                />
            )}

            {/* Floating Toggle Button - always visible in dev */}
            {mounted && (
                <button
                    onClick={() => setIsEnabled(prev => !prev)}
                    className="fixed bottom-4 right-4 z-9999 px-3 py-2 font-mono text-xs border transition-colors"
                    style={{
                        backgroundColor: isEnabled ? '#88FF66' : '#FFFFFF',
                        borderColor: '#E0E0E0',
                        color: '#050505',
                    }}
                >
                    {isEnabled ? '[ AGENTATION ON ]' : '[ AGENTATION OFF ]'}
                </button>
            )}
        </>
    )
}
