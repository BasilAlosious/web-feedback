"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface CommentPinProps {
    x: number
    y: number
    number: number
    author?: string
    content?: string
    isNew?: boolean
    onSave?: (content: string) => void
    onCancel?: () => void
    onClick?: () => void
}

export function CommentPin({ x, y, number, author, content, isNew, onSave, onCancel, onClick }: CommentPinProps) {
    const [inputValue, setInputValue] = useState("")
    const [isExpanded, setIsExpanded] = useState(isNew)

    const handleSave = () => {
        if (!inputValue.trim()) return
        onSave?.(inputValue)
        setInputValue("")
        if (!isNew) setIsExpanded(false)
    }

    const handleCancel = () => {
        setIsExpanded(false)
        onCancel?.()
    }

    return (
        <div
            className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            {/* Pin Marker */}
            <button
                className={cn(
                    "pin-marker transition-transform hover:scale-110",
                    isNew && "animate-pulse"
                )}
                onClick={() => {
                    if (!isNew) {
                        setIsExpanded(!isExpanded)
                        onClick?.()
                    }
                }}
            >
                {number}
            </button>

            {/* Expanded Card */}
            {(isExpanded || isNew) && (
                <div className="absolute left-full ml-2 top-0 w-64 bg-background border border-border shadow-lg">
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <span className="font-mono text-xs font-medium">
                            #{number} {author || "You"}
                        </span>
                        {!isNew && (
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="font-mono text-xs text-muted-foreground hover:text-foreground"
                            >
                                [×]
                            </button>
                        )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3">
                        {isNew ? (
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSave()
                                        }
                                        if (e.key === "Escape") {
                                            handleCancel()
                                        }
                                    }}
                                    className="w-full bg-transparent border border-border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-foreground"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={handleCancel}
                                        className="font-mono text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="btn-action-primary px-3 py-1 text-xs"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm">{content}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
