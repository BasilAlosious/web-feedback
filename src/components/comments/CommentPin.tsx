"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type Priority = 'high' | 'medium' | 'low'

const PRIORITY_CYCLE: Record<string, Priority | undefined> = {
    none: 'high',
    high: 'medium',
    medium: 'low',
    low: undefined,
}

const PRIORITY_LABEL: Record<Priority, string> = {
    high: '[↑ HIGH]',
    medium: '[→ MED]',
    low: '[↓ LOW]',
}

const PRIORITY_COLOR: Record<Priority, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#9CA3AF',
}

interface CommentPinProps {
    x: number
    y: number
    width?: number
    height?: number
    number: number
    author?: string
    content?: string
    priority?: Priority
    isNew?: boolean
    isHighlighted?: boolean
    onSave?: (content: string, priority?: Priority) => void
    onCancel?: () => void
    onClick?: () => void
}

export function CommentPin({
    x, y, width, height, number, author, content, priority,
    isNew, isHighlighted, onSave, onCancel, onClick
}: CommentPinProps) {
    const [inputValue, setInputValue] = useState("")
    const [selectedPriority, setSelectedPriority] = useState<Priority | undefined>(undefined)
    const [isExpanded, setIsExpanded] = useState(isNew)

    const handleSave = () => {
        if (!inputValue.trim()) return
        onSave?.(inputValue, selectedPriority)
        setInputValue("")
        setSelectedPriority(undefined)
        if (!isNew) setIsExpanded(false)
    }

    const handleCancel = () => {
        setIsExpanded(false)
        onCancel?.()
    }

    const cyclePriority = () => {
        const current = selectedPriority ?? 'none'
        setSelectedPriority(PRIORITY_CYCLE[current])
    }

    const pinColor = priority ? PRIORITY_COLOR[priority] : undefined
    const hasArea = width && height && width > 0 && height > 0

    return (
        <>
            {/* Area rectangle for area-based comments */}
            {hasArea && (
                <div
                    className={cn(
                        "absolute pointer-events-none transition-all duration-150",
                        isHighlighted && "z-40"
                    )}
                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        border: isHighlighted
                            ? "2px solid #FACC15"
                            : "2px solid rgba(136, 255, 102, 0.5)",
                        backgroundColor: isHighlighted
                            ? "rgba(250, 204, 21, 0.2)"
                            : "rgba(136, 255, 102, 0.05)",
                    }}
                />
            )}

            {/* Pin marker container */}
            <div
                className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
            >
                {/* Pin Marker */}
                <button
                    className={cn(
                        "pin-marker transition-all duration-150 hover:scale-110",
                        isNew && "animate-pulse",
                        isHighlighted && "ring-4 ring-yellow-400 ring-opacity-75"
                    )}
                    style={pinColor ? { background: pinColor } : undefined}
                    onClick={() => {
                        if (!isNew) {
                            setIsExpanded(!isExpanded)
                            onClick?.()
                        }
                    }}
                >
                    {number}
                </button>

                {/* Existing comment card (click to expand) */}
                {!isNew && isExpanded && (
                    <div className="absolute left-8 top-0 z-50 w-64 bg-background border border-border shadow-lg">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-medium">
                                    #{number} {author || "You"}
                                </span>
                                {priority && (
                                    <span className="font-mono text-xs" style={{ color: PRIORITY_COLOR[priority] }}>
                                        {PRIORITY_LABEL[priority]}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="font-mono text-xs text-muted-foreground hover:text-foreground"
                            >
                                [×]
                            </button>
                        </div>
                        <div className="p-3">
                            <p className="text-sm">{content}</p>
                        </div>
                    </div>
                )}

                {/* New comment floating card */}
                {isNew && (
                    <div className="absolute left-8 top-0 z-50 w-64 bg-background border border-border shadow-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                            <span className="font-mono text-xs uppercase text-muted-foreground">
                                / Add {hasArea ? "Area" : ""} Comment
                            </span>
                            <button
                                onClick={handleCancel}
                                className="font-mono text-xs text-muted-foreground hover:text-foreground"
                            >
                                [×]
                            </button>
                        </div>

                        {/* Textarea */}
                        <textarea
                            className="w-full px-3 py-2.5 text-sm font-mono bg-transparent resize-none focus:outline-none border-b border-border-light"
                            placeholder="Or type your comment here..."
                            rows={3}
                            autoFocus
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSave()
                                }
                                if (e.key === "Escape") {
                                    handleCancel()
                                }
                            }}
                        />

                        {/* Footer: priority picker + send */}
                        <div className="flex items-center justify-between px-3 py-2">
                            <button
                                onClick={cyclePriority}
                                className="font-mono text-xs transition-colors"
                                style={selectedPriority ? { color: PRIORITY_COLOR[selectedPriority] } : { color: '#9CA3AF' }}
                                title="Set priority (click to cycle)"
                            >
                                {selectedPriority ? PRIORITY_LABEL[selectedPriority] : '[— PRI]'}
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-action-primary px-3 py-1 text-xs"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
