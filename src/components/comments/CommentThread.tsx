"use client"

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
    onUpdateStatus?: (commentId: string, status: 'open' | 'in_progress' | 'resolved') => void
    onUpdatePriority?: (commentId: string, priority: 'high' | 'medium' | 'low' | undefined) => void
    onHoverComment?: (comment: Comment | null) => void
    highlightedCommentId?: string
}

export function CommentThread({
    markupId,
    comments,
    onClose,
    onUpdateStatus,
    onUpdatePriority,
    onHoverComment,
    highlightedCommentId,
}: CommentThreadProps) {
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
        <div className="w-80 border-l h-full flex flex-col" style={{ backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" }}>
            {/* Header */}
            <div
                className="flex items-center justify-between flex-shrink-0 px-5 h-10"
                style={{ backgroundColor: "#F5F5F5" }}
            >
                <span className="font-mono text-[9px] font-semibold uppercase" style={{ color: "#888888" }}>
                    COMMENTS
                </span>
                <button
                    onClick={onClose}
                    className="font-mono text-[11px] transition-colors hover:text-[#050505]"
                    style={{ color: "#888888" }}
                >
                    [×] Close
                </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: "#FFFFFF" }}>
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="font-mono text-[11px] uppercase" style={{ color: "#888888" }}>
                            No comments yet.
                        </p>
                        <p className="font-mono text-[11px] mt-1" style={{ color: "#888888" }}>
                            Click anywhere to add one.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {comments.map((comment, i) => {
                            const status = comment.status ?? 'open'
                            const priColor = comment.priority ? PRIORITY_COLOR[comment.priority] : 'text-muted-foreground'
                            const priLabel = comment.priority ? PRIORITY_LABEL[comment.priority] : '[— PRI]'
                            const hasArea = comment.width && comment.height && comment.width > 0 && comment.height > 0
                            const isHighlighted = highlightedCommentId === comment.id

                            return (
                                <div
                                    key={comment.id}
                                    className="p-3 transition-colors cursor-pointer"
                                    style={{
                                        backgroundColor: isHighlighted ? "#FEF3C7" : "#F5F5F5",
                                        border: isHighlighted ? "1px solid #FACC15" : "1px solid transparent"
                                    }}
                                    onMouseEnter={() => onHoverComment?.(comment)}
                                    onMouseLeave={() => onHoverComment?.(null)}
                                >
                                    {/* Comment Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="pin-marker w-6 h-6 text-xs">
                                                {i + 1}
                                            </span>
                                            <span className="font-mono text-xs font-medium">
                                                {comment.author}
                                                {comment.isGuest && (
                                                    <span className="ml-1 px-1 py-0.5 bg-[#E0E0E0] text-[#888888] text-[9px] uppercase">
                                                        GUEST
                                                    </span>
                                                )}
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
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {formatDate(comment.createdAt)} · @{Math.round(comment.x)}%,{Math.round(comment.y)}%
                                            </span>
                                            {hasArea && (
                                                <span className="font-mono text-[10px] px-1 py-0.5 bg-[#88FF66]/20 text-[#4CAF50]">
                                                    [AREA]
                                                </span>
                                            )}
                                        </div>

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
        </div>
    )
}
