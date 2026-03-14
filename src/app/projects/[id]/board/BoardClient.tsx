"use client"

import { useState } from "react"
import { Comment } from "@/lib/db"
import { updateCommentStatus } from "@/app/actions"

interface BoardClientProps {
    projectId: string
    projectName: string
    markupNames: Record<string, string>
    initialComments: Comment[]
}

const COLUMNS: { key: Comment["status"]; label: string; indicator: string }[] = [
    { key: "open", label: "OPEN", indicator: "○" },
    { key: "in_progress", label: "IN PROGRESS", indicator: "~" },
    { key: "resolved", label: "RESOLVED", indicator: "✓" },
]

const NEXT_STATUS: Record<string, Comment["status"]> = {
    open: "in_progress",
    in_progress: "resolved",
    resolved: "open",
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
    high: { label: "[!!]", className: "text-red-400" },
    medium: { label: "[~]", className: "text-yellow-400" },
    low: { label: "[-]", className: "text-muted-foreground" },
}

export function BoardClient({ projectId, projectName, markupNames, initialComments }: BoardClientProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)

    const handleAdvanceStatus = async (comment: Comment) => {
        const nextStatus = NEXT_STATUS[comment.status ?? "open"]!
        // Optimistic update
        setComments(prev =>
            prev.map(c => c.id === comment.id ? { ...c, status: nextStatus } : c)
        )
        try {
            await updateCommentStatus(comment.id, nextStatus)
        } catch {
            // Revert on error
            setComments(prev =>
                prev.map(c => c.id === comment.id ? { ...c, status: comment.status } : c)
            )
        }
    }

    const getColumnComments = (status: Comment["status"]) =>
        comments.filter(c => (c.status ?? "open") === status)

    // Global comment index for numbering
    const commentIndex = (id: string) => comments.findIndex(c => c.id === id) + 1

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Board Header */}
            <div className="h-10 border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
                <span className="font-mono text-xs text-muted-foreground uppercase">
                    [ BOARD ] /
                </span>
                <span className="font-mono text-xs text-foreground uppercase">{projectName}</span>
                <span className="font-mono text-xs text-muted-foreground ml-auto">
                    {comments.length} comment{comments.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full gap-0 min-w-[720px]">
                    {COLUMNS.map((col, colIdx) => {
                        const colComments = getColumnComments(col.key)
                        return (
                            <div
                                key={col.key}
                                className={`flex flex-col flex-1 border-r border-border overflow-hidden ${colIdx === 0 ? "border-l border-border" : ""}`}
                            >
                                {/* Column Header */}
                                <div className="h-10 border-b border-border flex items-center px-4 gap-2 flex-shrink-0 bg-card">
                                    <span className={`font-mono text-xs ${
                                        col.key === "open" ? "text-foreground" :
                                        col.key === "in_progress" ? "text-yellow-400" :
                                        "text-green-400"
                                    }`}>
                                        [{col.indicator}]
                                    </span>
                                    <span className="font-mono text-xs uppercase text-foreground">
                                        {col.label}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground ml-auto">
                                        {colComments.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                                    {colComments.length === 0 && (
                                        <div className="flex items-center justify-center h-16 border border-dashed border-border rounded-none">
                                            <span className="font-mono text-xs text-muted-foreground uppercase">
                                                — empty —
                                            </span>
                                        </div>
                                    )}
                                    {colComments.map((comment) => {
                                        const pageName = markupNames[comment.markupId] ?? "unknown"
                                        const num = commentIndex(comment.id)
                                        const pri = comment.priority ? PRIORITY_BADGE[comment.priority] : null
                                        const date = new Date(comment.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                        const isLast = col.key === "resolved"

                                        return (
                                            <div
                                                key={comment.id}
                                                className="border border-border bg-card p-3 flex flex-col gap-2 hover:border-foreground transition-colors"
                                            >
                                                {/* Card Top Row */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                                                            #{num}
                                                        </span>
                                                        {pri && (
                                                            <span className={`font-mono text-xs flex-shrink-0 ${pri.className}`}>
                                                                {pri.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleAdvanceStatus(comment)}
                                                        title={isLast ? "Reopen" : "Advance status"}
                                                        className="font-mono text-xs text-muted-foreground hover:text-foreground flex-shrink-0 border border-border px-1.5 py-0.5 hover:border-foreground transition-colors"
                                                    >
                                                        {isLast ? "[↺]" : "[→]"}
                                                    </button>
                                                </div>

                                                {/* Comment Content */}
                                                <p className="font-mono text-xs text-foreground leading-relaxed line-clamp-3">
                                                    {comment.content}
                                                </p>

                                                {/* Card Footer */}
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
