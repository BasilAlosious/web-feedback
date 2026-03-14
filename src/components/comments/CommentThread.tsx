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

const PRIORITY_LABEL: Record<string, string> = {
    high: '[!!]',
    medium: '[~]',
    low: '[-]',
}

const PRIORITY_COLOR: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#9CA3AF',
}

interface CommentThreadProps {
    markupId: string
    comments: Comment[]
    onClose: () => void
    onAddComment?: (content: string) => void
    onUpdateStatus?: (commentId: string, status: 'open' | 'in_progress' | 'resolved') => void
}

export function CommentThread({ markupId, comments, onClose, onAddComment, onUpdateStatus }: CommentThreadProps) {
    const [inputValue, setInputValue] = useState("")

    const handleSubmit = () => {
        if (!inputValue.trim()) return
        onAddComment?.(inputValue)
        setInputValue("")
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
        <div className="detail-panel w-80 border-l border-border h-full">
            {/* Header */}
            <div className="detail-header">
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
                            return (
                                <div
                                    key={comment.id}
                                    className="p-4 border-b border-border-light hover:bg-muted/30 transition-colors"
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
                                            {comment.priority && (
                                                <span
                                                    className="font-mono text-xs"
                                                    style={{ color: PRIORITY_COLOR[comment.priority] }}
                                                >
                                                    {PRIORITY_LABEL[comment.priority]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/* Status toggle */}
                                            <button
                                                onClick={() => onUpdateStatus?.(comment.id, STATUS_NEXT[status])}
                                                className={`font-mono text-xs transition-colors ${
                                                    status === 'resolved'
                                                        ? 'text-[#88FF66]'
                                                        : status === 'in_progress'
                                                        ? 'text-[#F59E0B]'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                                title={`Status: ${status} — click to advance`}
                                            >
                                                {STATUS_ICON[status]}
                                            </button>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {formatTime(comment.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Comment Content */}
                                    <p className="text-sm text-foreground pl-8">
                                        {comment.content}
                                    </p>

                                    {/* Comment Meta */}
                                    <div className="flex items-center gap-4 mt-3 pl-8">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            @{Math.round(comment.x)}%, {Math.round(comment.y)}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-border">
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
                        <button
                            onClick={handleSubmit}
                            className="btn-action px-4"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
