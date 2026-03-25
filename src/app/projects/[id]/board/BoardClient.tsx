"use client"

import { useRef, useState } from "react"
import { Comment } from "@/lib/db"
import { updateCommentStatus, updateCommentPriority } from "@/app/actions"
import { ProjectHeader } from "@/components/layout/ProjectHeader"

interface BoardClientProps {
    projectId: string
    projectName: string
    markupNames: Record<string, string>
    initialComments: Comment[]
}

const COLUMNS: { key: NonNullable<Comment["status"]>; label: string }[] = [
    { key: "open",        label: "NEW" },
    { key: "in_progress", label: "IN PROGRESS" },
    { key: "resolved",    label: "RESOLVED" },
]

const NEXT_STATUS: Record<string, NonNullable<Comment["status"]>> = {
    open:        "in_progress",
    in_progress: "resolved",
    resolved:    "open",
}

// Cycling order: none → high → medium → low → none
const PRIORITY_CYCLE: Array<Comment["priority"]> = [undefined, "high", "medium", "low"]

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    high:   { label: "HIGH", color: "#EF4444", bgColor: "#FEE2E2" },
    medium: { label: "MED",  color: "#F59E0B", bgColor: "#FEF3C7" },
    low:    { label: "LOW",  color: "#6B7280", bgColor: "#F3F4F6" },
}

const COLUMN_COLOR: Record<string, string> = {
    open:        "text-foreground",
    in_progress: "text-yellow-400",
    resolved:    "text-[#88FF66]",
}

export function BoardClient({ projectId, projectName, markupNames, initialComments }: BoardClientProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [dragOverCol, setDragOverCol] = useState<string | null>(null)
    const draggedId = useRef<string | null>(null)

    // ── Status: advance button ─────────────────────────────────────────────
    const handleAdvanceStatus = async (comment: Comment) => {
        const next = NEXT_STATUS[comment.status ?? "open"]
        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, status: next } : c))
        try {
            await updateCommentStatus(comment.id, next)
        } catch {
            setComments(prev => prev.map(c => c.id === comment.id ? { ...c, status: comment.status } : c))
        }
    }

    // ── Priority: cycle button ─────────────────────────────────────────────
    const handleCyclePriority = async (comment: Comment) => {
        const idx = PRIORITY_CYCLE.indexOf(comment.priority)
        const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length]
        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, priority: next } : c))
        try {
            await updateCommentPriority(comment.id, next)
        } catch {
            setComments(prev => prev.map(c => c.id === comment.id ? { ...c, priority: comment.priority } : c))
        }
    }

    // ── Drag-and-drop ──────────────────────────────────────────────────────
    const handleDragStart = (e: React.DragEvent, commentId: string) => {
        draggedId.current = commentId
        e.dataTransfer.effectAllowed = "move"
        // ghost image: tiny transparent element
        const ghost = document.createElement("div")
        ghost.style.cssText = "position:fixed;top:-999px;left:-999px;width:1px;height:1px"
        document.body.appendChild(ghost)
        e.dataTransfer.setDragImage(ghost, 0, 0)
        setTimeout(() => document.body.removeChild(ghost), 0)
    }

    const handleDragEnd = () => {
        draggedId.current = null
        setDragOverCol(null)
    }

    const handleDragOver = (e: React.DragEvent, colKey: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverCol(colKey)
    }

    const handleDrop = async (e: React.DragEvent, colKey: NonNullable<Comment["status"]>) => {
        e.preventDefault()
        setDragOverCol(null)
        const id = draggedId.current
        if (!id) return
        const comment = comments.find(c => c.id === id)
        if (!comment) return
        const current = comment.status ?? "open"
        if (current === colKey) return

        setComments(prev => prev.map(c => c.id === id ? { ...c, status: colKey } : c))
        try {
            await updateCommentStatus(id, colKey)
        } catch {
            setComments(prev => prev.map(c => c.id === id ? { ...c, status: current } : c))
        }
    }

    const getColumnComments = (status: NonNullable<Comment["status"]>) =>
        comments.filter(c => (c.status ?? "open") === status)

    const commentIndex = (id: string) => comments.findIndex(c => c.id === id) + 1

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: "#F5F5F5" }}>
            {/* Project Context Header */}
            <ProjectHeader
                projectName={projectName}
                currentView="board"
                projectId={projectId}
            />

            {/* Kanban Columns */}
            <div className="flex-1 p-8 overflow-hidden">
                <div className="flex h-full gap-6">
                    {COLUMNS.map((col) => {
                        const colComments = getColumnComments(col.key)
                        const isDropTarget = dragOverCol === col.key
                        const isResolved = col.key === "resolved"

                        return (
                            <div
                                key={col.key}
                                className="flex flex-col flex-1 overflow-hidden transition-colors"
                                onDragOver={(e) => handleDragOver(e, col.key)}
                                onDragLeave={() => setDragOverCol(null)}
                                onDrop={(e) => handleDrop(e, col.key)}
                            >
                                {/* Column Header */}
                                <div
                                    className="h-10 flex items-center justify-center shrink-0 font-mono text-[11px] font-semibold"
                                    style={{
                                        backgroundColor: isResolved ? "#88FF66" : "#FFFFFF",
                                        border: isResolved ? "1px solid #88FF66" : "1px solid #E0E0E0",
                                        color: "#050505"
                                    }}
                                >
                                    {col.label}
                                </div>

                                {/* Drop hint when dragging */}
                                {isDropTarget && (
                                    <div className="mx-3 mt-4 h-1 border border-dashed" style={{ borderColor: "#88FF66" }} />
                                )}

                                {/* Cards */}
                                <div className="flex-1 overflow-y-auto mt-4 flex flex-col gap-2">
                                    {colComments.length === 0 && !isDropTarget && (
                                        <div
                                            className="flex items-center justify-center h-16 border border-dashed"
                                            style={{ borderColor: "#E0E0E0" }}
                                        >
                                            <span className="font-mono text-xs uppercase" style={{ color: "#888888" }}>
                                                — empty —
                                            </span>
                                        </div>
                                    )}

                                    {colComments.map((comment) => {
                                        const pageName = markupNames[comment.markupId] ?? "unknown"
                                        const num = commentIndex(comment.id)
                                        const priCfg = comment.priority ? PRIORITY_CONFIG[comment.priority] : null

                                        // Format time as relative (e.g., "2h ago")
                                        const formatTime = (dateString: string) => {
                                            const date = new Date(dateString)
                                            const now = new Date()
                                            const diff = now.getTime() - date.getTime()
                                            const hours = Math.floor(diff / 3600000)
                                            const days = Math.floor(diff / 86400000)
                                            if (hours < 24) return `${hours}h ago`
                                            return `${days}d ago`
                                        }

                                        return (
                                            <div
                                                key={comment.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, comment.id)}
                                                onDragEnd={handleDragEnd}
                                                className="p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing select-none transition-colors"
                                                style={{
                                                    backgroundColor: "#FFFFFF",
                                                    border: "1px solid #E0E0E0"
                                                }}
                                            >
                                                {/* Header: Author + Priority */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-semibold"
                                                            style={{ backgroundColor: "#F5F5F5", color: "#050505" }}
                                                        >
                                                            {comment.author?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                        <span className="font-mono text-[10px] font-medium" style={{ color: "#050505" }}>
                                                            {comment.author || "Unknown"}
                                                        </span>
                                                        {comment.isGuest && (
                                                            <span className="font-mono text-[8px] px-1 py-0.5" style={{ backgroundColor: "#F5F5F5", color: "#888888" }}>
                                                                GUEST
                                                            </span>
                                                        )}
                                                    </div>
                                                    {priCfg && (
                                                        <div
                                                            className="px-2 py-0.5 font-mono text-[8px] font-semibold"
                                                            style={{ backgroundColor: priCfg.bgColor, color: priCfg.color }}
                                                        >
                                                            {priCfg.label}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Comment Content */}
                                                <p className="font-mono text-[11px] leading-relaxed" style={{ color: "#050505" }}>
                                                    {comment.content}
                                                </p>

                                                {/* Footer: Page name + timestamp */}
                                                <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: "#F0F0F0" }}>
                                                    <span className="font-mono text-[9px]" style={{ color: "#888888" }}>
                                                        {pageName}
                                                    </span>
                                                    <span className="font-mono text-[9px]" style={{ color: "#A0A0A0" }}>
                                                        {formatTime(comment.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
