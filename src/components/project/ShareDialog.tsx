"use client"

import { useState, useEffect } from "react"

interface ShareDialogProps {
    markupId: string
    onClose: () => void
}

export function ShareDialog({ markupId, onClose }: ShareDialogProps) {
    const [copied, setCopied] = useState(false)
    const [shareUrl, setShareUrl] = useState(`/share/${markupId}`)

    useEffect(() => {
        setShareUrl(`${window.location.origin}/share/${markupId}`)
    }, [markupId])

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-foreground/20"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-sm bg-background border border-border shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-mono text-xs uppercase font-medium">/ Share Canvas</span>
                    <button
                        onClick={onClose}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground"
                    >
                        [×] Close
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3">
                    <span className="slash-label">Share URL</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            onFocus={(e) => e.target.select()}
                            className="flex-1 bg-transparent border border-border px-3 py-2 text-xs font-mono focus:outline-none focus:border-foreground text-muted-foreground"
                        />
                        <button
                            onClick={handleCopy}
                            className={`btn-action text-xs px-3 whitespace-nowrap ${copied ? "btn-action-primary" : ""}`}
                        >
                            {copied ? "[✓] Copied!" : "[→] Copy Link"}
                        </button>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                        Anyone with this link can view and leave comments.
                    </p>
                </div>
            </div>
        </div>
    )
}
