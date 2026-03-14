"use client"

import { useRef, useState } from "react"
import { Comment } from "@/lib/db"
import { updateCommentStatus, updateCommentPriority } from "@/app/actions"

interface BoardClientProps {
    projectId: string
    projectName: string
    markupNames: Record<string, string>
    initialComments: Comment[]
}

const COLUMNS: { key: NonNullable<Comment["status"]>; label: string; indicator: string }[] = [
    { key: "open",        label: "OPEN",        indicator: "○" },
    { key: "in_progress", label: "IN PROGRESS", indicator: "~" },
    { key: "resolved",    label: "RESOLVED",    indicator: "✓" },
]

const NEXT_STATUS: Record<string, NonNullable<Comment["status"]>> = {
    open:        "in_progress",
    in_progress: "resolved",
    resolved:    "open",
}

// Cycling order: none → high → medium → low → none
const PRIORITY_CYCLE: Array<Comment["priority"]> = [undefined, "high", "medium", "low"]

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
    high:   { label: "[!!] HIGH", className: "text-red-400" },
    medium: { label: "[~]  MED",  className: "text-yellow-400" },
    low:    { label: "[-]  LOW",  className: "text-muted-foreground" },
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
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Board Header */}
            <div className="h-10 border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
                <span className="font-mono text-xs text-muted-foreground uppercase">[ BOARD ] /</span>
                <span className="font-mono text-xs text-foreground uppercase">{projectName}</span>
                <span className="font-mono text-xs text-muted-foreground ml-auto">
                    {comments.length} comment{comments.length !== 1 ? "s" : ""}
                </span>
                <span className="font-mono text-xs text-muted-foreground border-l border-border pl-3">
                    drag cards to move · click priority to cycle
                </span>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full gap-0 min-w-[720px]">
                    {COLUMNS.map((col, colIdx) => {
                        const colComments = getColumnComments(col.key)
                        const isDropTarget = dragOverCol === col.key

                        return (
                            <div
                                key={col.key}
                                className={`flex flex-col flex-1 overflow-hidden transition-colors
                                    ${colIdx === 0 ? "border-l border-border" : ""}
                                    border-r border-border
                                    ${isDropTarget ? "bg-muted/40" : ""}
                                `}
                                onDragOver={(e) => handleDragOver(e, col.key)}
                                onDragLeave={() => setDragOverCol(null)}
                                onDrop={(e) => handleDrop(e, col.key)}
                            >
                                {/* Column Header */}
                                <div className={`h-10 border-b flex items-center px-4 gap-2 flex-shrink-0 bg-card
                                    ${isDropTarget ? "border-border" : "border-border"}`}>
                                    <span className={`font-mono text-xs ${COLUMN_COLOR[col.key]}`}>
                                        [{col.indicator}]
                                    </span>
                                    <span className="font-mono text-xs uppercase text-foreground">
                                        {col.label}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground ml-auto">
                                        {colComments.length}
                                    </span>
                                </div>

                                {/* Drop hint when dragging */}
                                {isDropTarget && (
                                    <div className="mx-3 mt-3 h-1 bg-foreground/20 border border-dashed border-foreground/40 flex-shrink-0" />
                                )}

                                {/* Cards */}
                                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                                    {colComments.length === 0 && !isDropTarget && (
                                        <div className="flex items-center justify-center h-16 border border-dashed border-border">
                                            <span className="font-mono text-xs text-muted-foreground uppercase">
                                                — empty —
                                            </span>
                                        </div>
                                    )}

                                    {colComments.map((comment) => {
                                        const pageName = markupNames[comment.markupId] ?? "unknown"
                                        const num = commentIndex(comment.id)
                                        const priCfg = comment.priority ? PRIORITY_CONFIG[comment.priority] : null
                                        const date = new Date(comment.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                        const isResolved = col.key === "resolved"

                                        return (
                                            <div
                                                key={comment.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, comment.id)}
                                                onDragEnd={handleDragEnd}
                                                className="border border-border bg-card p-3 flex flex-col gap-2
                                                    hover:border-foreground transition-colors cursor-grab active:cursor-grabbing
                                                    select-none"
                                            >
                                                {/* Top Row: number + priority + status button */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                                                            #{num}
                                                        </span>

                                                        {/* Priority cycling button */}
                                                        <button
                                                            onClick={() => handleCyclePriority(comment)}
                                                            title="Click to cycle priority: high → medium → low → none"
                                                            className={`font-mono text-xs flex-shrink-0 border border-border px-1.5 py-0.5
                                                                hover:border-foreground transition-colors
                                                                ${priCfg ? priCfg.className : "text-muted-foreground hover:text-foreground"}`}
                                                        >
                                                            {priCfg ? priCfg.label : "[— PRI]"}
                                                        </button>
                                                    </div>

                                                    {/* Advance status button */}
                                                    <button
                                                        onClick={() => handleAdvanceStatus(comment)}
                                                        title={isResolved ? "Reopen" : "Advance status"}
                                                        className="font-mono text-xs text-muted-foreground hover:text-foreground
                                                            flex-shrink-0 border border-border px-1.5 py-0.5
                                                            hover:border-foreground transition-colors"
                                                    >
                                                        {isResolved ? "[↺]" : "[→]"}
                                                    </button>
                                                </div>

                                                {/* Comment content */}
                                                <p className="font-mono text-xs text-foreground leading-relaxed line-clamp-3">
                                                    {comment.content}
                                                </p>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                                                    <span className="font-mono text-xs text-muted-foreground truncate">
                                                        /{pageName}
                                                    </span>
                                                    <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                                                        {comment.author} · {date}
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
