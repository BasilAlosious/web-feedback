"use client"

import { useState } from "react"
import { Comment } from "@/lib/db"

const STATUS_NEXT: Record<string, 'open' | 'in_progress' | 'resolved'> = {
    open: 'in_progress',
    in_progress: 'resolved',
    resolved: 'open',
}

const STATUS_ICON: Record<string, string> = {
    open: '[○]',
    in_progress: '[~]',
    resolved: '[✓]',
}

const STATUS_LABEL: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
}

// Cycling: none → high → medium → low → none
const PRIORITY_CYCLE: Array<Comment["priority"]> = [undefined, 'high', 'medium', 'low']

const PRIORITY_LABEL: Record<string, string> = {
    high:   '[!!] HIGH',
    medium: '[~]  MED',
    low:    '[-]  LOW',
}

const PRIORITY_COLOR: Record<string, string> = {
    high:   'text-red-400',
    medium: 'text-yellow-400',
    low:    'text-muted-foreground',
}

interface CommentThreadProps {
    markupId: string
    comments: Comment[]
    onClose: () => void
    onAddComment?: (content: string) => void
    onUpdateStatus?: (commentId: string, status: 'open' | 'in_progress' | 'resolved') => void
    onUpdatePriority?: (commentId: string, priority: 'high' | 'medium' | 'low' | undefined) => void
}

export function CommentThread({
    markupId,
    comments,
    onClose,
    onAddComment,
    onUpdateStatus,
    onUpdatePriority,
}: CommentThreadProps) {
    const [inputValue, setInputValue] = useState("")

    const handleSubmit = () => {
        if (!inputValue.trim()) return
        onAddComment?.(inputValue)
        setInputValue("")
    }

    const handleCyclePriority = (comment: Comment) => {
        const idx = PRIORITY_CYCLE.indexOf(comment.priority)
        const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length]
        onUpdatePriority?.(comment.id, next)
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    return (
        <div className="detail-panel w-80 border-l border-border h-full flex flex-col">
            {/* Header */}
            <div className="detail-header flex-shrink-0">
                <span className="slash-label">Comments</span>
                <button onClick={onClose} className="nav-item">
                    <span className="text-foreground">[×]</span> Close
                </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="status-widget w-32 h-20 mb-4">
                            <div className="status-widget-header">[ EMPTY ]</div>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground uppercase">
                            No comments yet.
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                            Click anywhere to add one.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {comments.map((comment, i) => {
                            const status = comment.status ?? 'open'
                            const priColor = comment.priority ? PRIORITY_COLOR[comment.priority] : 'text-muted-foreground'
                            const priLabel = comment.priority ? PRIORITY_LABEL[comment.priority] : '[— PRI]'

                            return (
                                <div
                                    key={comment.id}
                                    className="p-4 border-b border-border hover:bg-muted/30 transition-colors"
                                >
                                    {/* Comment Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="pin-marker w-6 h-6 text-xs">
                                                {i + 1}
                                            </span>
                                            <span className="font-mono text-xs font-medium">
                                                {comment.author}
                                            </span>
                                        </div>

                                        {/* Right: status toggle + time */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => onUpdateStatus?.(comment.id, STATUS_NEXT[status])}
                                                className={`font-mono text-xs transition-colors ${
                                                    status === 'resolved'   ? 'text-[#88FF66]' :
                                                    status === 'in_progress' ? 'text-yellow-400' :
                                                    'text-muted-foreground hover:text-foreground'
                                                }`}
                                                title={`Status: ${STATUS_LABEL[status]} — click to advance`}
                                            >
                                                {STATUS_ICON[status]}
                                            </button>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {formatTime(comment.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Comment Content */}
                                    <p className="text-sm text-foreground pl-8 leading-relaxed">
                                        {comment.content}
                                    </p>

                                    {/* Comment Meta + priority button */}
                                    <div className="flex items-center justify-between mt-3 pl-8">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {formatDate(comment.createdAt)} · @{Math.round(comment.x)}%,{Math.round(comment.y)}%
                                        </span>

                                        {/* Priority cycling button */}
                                        <button
                                            onClick={() => handleCyclePriority(comment)}
                                            title="Click to cycle priority: high → medium → low → none"
                                            className={`font-mono text-xs border border-border px-1.5 py-0.5
                                                hover:border-foreground transition-colors ${priColor}`}
                                        >
                                            {priLabel}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-border flex-shrink-0">
                <div className="flex flex-col gap-2">
                    <span className="slash-label">Add Comment</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type your comment..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit()
                                }
                            }}
                            className="flex-1 bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                        />
                        <button onClick={handleSubmit} className="btn-action px-4">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
