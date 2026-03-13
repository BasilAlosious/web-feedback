"use client"

import { useEffect, useState } from "react"
import { Agentation, type Annotation } from "agentation"

interface AgentationProviderProps {
    children: React.ReactNode
}

export function AgentationProvider({ children }: AgentationProviderProps) {
    const [isEnabled, setIsEnabled] = useState(false)
    const [isDevelopment, setIsDevelopment] = useState(false)

    useEffect(() => {
        // Check if we're in development mode
        setIsDevelopment(process.env.NODE_ENV === 'development')

        // Keyboard shortcut to toggle: Ctrl+Shift+A (or Cmd+Shift+A on Mac)
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault()
                setIsEnabled(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

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

            {/* Status Indicator */}
            {isEnabled && (
                <div className="fixed bottom-4 right-4 z-[9999]">
                    <div className="status-widget w-48 h-16">
                        <div className="status-widget-header">[ AGENTATION ]</div>
                        <div className="px-3 py-2">
                            <span className="font-mono text-xs text-muted-foreground">
                                <span className="text-accent">ACTIVE</span> • Press{" "}
                                <span className="text-foreground">
                                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+A
                                </span>{" "}
                                to toggle
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
