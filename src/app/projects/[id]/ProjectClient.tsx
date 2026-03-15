"use client"

import { useState } from "react"
import { Maximize, Minimize } from "lucide-react"
import { Markup, Comment, Project } from "@/lib/db"
import { IframeRenderer } from "@/components/markup/IframeRenderer"
import { CanvasRenderer } from "@/components/markup/CanvasRenderer"
import { CommentPin } from "@/components/comments/CommentPin"
import { CommentThread } from "@/components/comments/CommentThread"
import { CreateMarkupDialog } from "@/components/project/CreateMarkupDialog"
import { ShareDialog } from "@/components/project/ShareDialog"
import {
    addComment,
    createMarkup,
    getComments,
    renameMarkup,
    deleteMarkup,
    updateCommentStatus,
    updateCommentPriority,
} from "@/app/actions"
import Link from "next/link"

interface ProjectClientProps {
    projectId: string
    project?: Project
    markups: Markup[]
    initialSelectedMarkup?: Markup
    initialComments: Comment[]
}

type Priority = 'high' | 'medium' | 'low'

const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
    })
}

const STATUS_OPTIONS = [
    { label: "Open", value: "open", color: "#050505" },
    { label: "In Progress", value: "in_progress", color: "#888888" },
    { label: "Resolved", value: "resolved", color: "#88FF66" },
]

const PRIORITY_OPTIONS = [
    { label: "High", value: "high", color: "#EF4444" },
    { label: "Med", value: "medium", color: "#F59E0B" },
    { label: "Low", value: "low", color: "#9CA3AF" },
]

export function ProjectClient({
    projectId,
    project,
    markups: initialMarkups,
    initialSelectedMarkup,
    initialComments,
}: ProjectClientProps) {
    const [markups, setMarkups] = useState<Markup[]>(initialMarkups)
    const [selectedMarkup, setSelectedMarkup] = useState<Markup | undefined>(initialSelectedMarkup)
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")
    const [mode, setMode] = useState<"browse" | "comment">("comment")
    const [useProxy] = useState(true)
    const [newComment, setNewComment] = useState<{ x: number; y: number } | null>(null)

    // Filters
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null)

    // Share dialog
    const [showShare, setShowShare] = useState(false)

    // Rename / delete state
    const [editingMarkupId, setEditingMarkupId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")
    const [deletingMarkupId, setDeletingMarkupId] = useState<string | null>(null)

    // In-app fullscreen (hides all panels, stays within browser window)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const handleFullscreen = () => setIsFullscreen(f => !f)

    // Comments panel visibility
    const [showComments, setShowComments] = useState(true)

    // ── Page selection ──────────────────────────────────────────────────────
    const handlePageSelect = async (markup: Markup) => {
        setSelectedMarkup(markup)
        setNewComment(null)
        setShowComments(true)
        const fetched = await getComments(markup.id)
        setComments(fetched)
    }

    // ── Comment creation ────────────────────────────────────────────────────
    const handleCanvasClick = (x: number, y: number) => {
        if (mode === "comment") {
            setNewComment({ x, y })
        }
    }

    const handleSaveComment = async (content: string, priority?: Priority) => {
        if (!newComment || !selectedMarkup) return
        const tempId = Math.random().toString(36).substring(7)
        const optimistic: Comment = {
            id: tempId,
            markupId: selectedMarkup.id,
            x: newComment.x,
            y: newComment.y,
            content,
            author: "Agency User",
            createdAt: new Date().toISOString(),
            priority,
            status: 'open',
        }
        setComments(prev => [...prev, optimistic])
        setNewComment(null)
        try {
            const saved = await addComment(selectedMarkup.id, content, newComment.x, newComment.y, "Agency User", priority)
            setComments(prev => prev.map(c => c.id === tempId ? saved : c))
        } catch {
            setComments(prev => prev.filter(c => c.id !== tempId))
        }
    }

    // ── Comment status update ───────────────────────────────────────────────
    const handleUpdateStatus = async (commentId: string, status: 'open' | 'in_progress' | 'resolved') => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, status } : c))
        try {
            await updateCommentStatus(commentId, status)
        } catch {
            // revert on failure
            const fetched = await getComments(selectedMarkup?.id ?? "")
            setComments(fetched)
        }
    }

    // ── Comment priority update ─────────────────────────────────────────────
    const handleUpdatePriority = async (commentId: string, priority: 'high' | 'medium' | 'low' | undefined) => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, priority } : c))
        try {
            await updateCommentPriority(commentId, priority)
        } catch {
            const fetched = await getComments(selectedMarkup?.id ?? "")
            setComments(fetched)
        }
    }

    // ── Create markup ───────────────────────────────────────────────────────
    const handleCreateMarkup = async (name: string, url: string, type: "website" | "image", file?: File) => {
        let finalUrl = url
        if (type === "image" && file) {
            try { finalUrl = await convertFileToBase64(file) } catch { return }
        }
        const formData = new FormData()
        formData.append("projectId", projectId)
        formData.append("name", name)
        formData.append("url", finalUrl)
        formData.append("type", type)
        formData.append("viewport", "desktop")
        await createMarkup(null, formData)
        window.location.reload()
    }

    // ── Rename markup ───────────────────────────────────────────────────────
    const handleRenameStart = (m: Markup, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingMarkupId(m.id)
        setEditingName(m.name)
        setDeletingMarkupId(null)
    }

    const handleRenameConfirm = async () => {
        if (!editingMarkupId || !editingName.trim()) {
            setEditingMarkupId(null)
            return
        }
        const newName = editingName.trim()
        setMarkups(prev => prev.map(m => m.id === editingMarkupId ? { ...m, name: newName } : m))
        if (selectedMarkup?.id === editingMarkupId) {
            setSelectedMarkup(prev => prev ? { ...prev, name: newName } : prev)
        }
        setEditingMarkupId(null)
        try {
            await renameMarkup(editingMarkupId, newName)
        } catch {
            window.location.reload()
        }
    }

    // ── Delete markup ───────────────────────────────────────────────────────
    const handleDeleteConfirm = async (markupId: string) => {
        const remaining = markups.filter(m => m.id !== markupId)
        setMarkups(remaining)
        setDeletingMarkupId(null)
        if (selectedMarkup?.id === markupId) {
            const next = remaining[0]
            setSelectedMarkup(next)
            setComments(next ? await getComments(next.id) : [])
        }
        try {
            await deleteMarkup(markupId)
        } catch {
            window.location.reload()
        }
    }

    // ── Filtered comments ───────────────────────────────────────────────────
    const visibleComments = comments.filter(c => {
        const statusMatch = !statusFilter || (c.status ?? 'open') === statusFilter
        const priorityMatch = !priorityFilter || c.priority === priorityFilter
        return statusMatch && priorityMatch
    })

    const fallbackImage = "https://placehold.co/1920x1080/png?text=Website+Screenshot"

    return (
        <div
            className={isFullscreen
                ? "fixed inset-0 z-50 bg-background grid"
                : "grid h-full"
            }
            style={{ gridTemplateColumns: isFullscreen ? "1fr" : showComments && selectedMarkup ? "260px 1fr 320px" : "260px 1fr" }}
        >
            {/* LEFT: Pages panel */}
            <aside className={`border-r border-border flex flex-col overflow-hidden ${isFullscreen ? "hidden" : ""}`}>
                {/* Project header */}
                <div className="p-5 border-b border-border flex-shrink-0">
                    <Link href="/" className="nav-item block mb-3">
                        <span className="text-foreground">[←]</span> Back
                    </Link>
                    <h1 className="page-title">
                        {project?.name || "Project"}
                        <sup className="count-superscript">{markups.length}</sup>
                    </h1>
                    {project?.url && (
                        <p className="font-mono text-xs text-muted-foreground uppercase mt-1 truncate">
                            {project.url}
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                    {/* Pages list */}
                    <div>
                        <div className="slash-label mb-2">Pages</div>
                        {markups.length === 0 ? (
                            <p className="font-mono text-xs text-muted-foreground py-2">No pages yet.</p>
                        ) : (
                            <div className="flex flex-col">
                                {markups.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`group relative flex items-center gap-1 px-2 py-2 transition-colors ${
                                            selectedMarkup?.id === m.id
                                                ? "text-foreground font-medium bg-muted"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {editingMarkupId === m.id ? (
                                            /* Inline rename input */
                                            <input
                                                autoFocus
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleRenameConfirm()
                                                    if (e.key === "Escape") setEditingMarkupId(null)
                                                }}
                                                onBlur={handleRenameConfirm}
                                                className="flex-1 bg-transparent border-b border-foreground text-sm font-mono focus:outline-none"
                                            />
                                        ) : deletingMarkupId === m.id ? (
                                            /* Inline delete confirmation */
                                            <span className="flex-1 font-mono text-xs">
                                                Delete?{" "}
                                                <button
                                                    onClick={() => handleDeleteConfirm(m.id)}
                                                    className="text-red-500 hover:underline ml-1"
                                                >
                                                    [Y]
                                                </button>
                                                <button
                                                    onClick={() => setDeletingMarkupId(null)}
                                                    className="text-muted-foreground hover:text-foreground ml-1"
                                                >
                                                    [N]
                                                </button>
                                            </span>
                                        ) : (
                                            <>
                                                {/* Page select button */}
                                                <button
                                                    onClick={() => handlePageSelect(m)}
                                                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                                                >
                                                    <span className="text-xs opacity-60 flex-shrink-0">📄</span>
                                                    <span className="text-sm flex-1 truncate">{m.name}</span>
                                                    {m.commentCount > 0 && (
                                                        <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                                                            {m.commentCount}
                                                        </span>
                                                    )}
                                                </button>
                                                {/* Hover actions */}
                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleRenameStart(m, e)}
                                                        className="font-mono text-xs text-muted-foreground hover:text-foreground px-0.5"
                                                        title="Rename"
                                                    >
                                                        [✎]
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeletingMarkupId(m.id); setEditingMarkupId(null) }}
                                                        className="font-mono text-xs text-muted-foreground hover:text-red-500 px-0.5"
                                                        title="Delete"
                                                    >
                                                        [×]
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add page */}
                    <CreateMarkupDialog onCreate={handleCreateMarkup} />

                    {/* Status filter */}
                    <div>
                        <div className="slash-label mb-2">Filter by Status</div>
                        <div className="flex flex-col gap-1">
                            {STATUS_OPTIONS.map(({ label, value, color }) => {
                                const active = statusFilter === value
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setStatusFilter(active ? null : value)}
                                        className={`flex items-center gap-2 text-sm py-1 text-left transition-colors ${
                                            active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span
                                            className="inline-block w-1.5 h-1.5 flex-shrink-0"
                                            style={{ background: active ? color : undefined, border: active ? undefined : `1px solid ${color}` }}
                                        />
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Priority filter */}
                    <div>
                        <div className="slash-label mb-2">Filter by Priority</div>
                        <div className="flex flex-col gap-1">
                            {PRIORITY_OPTIONS.map(({ label, value, color }) => {
                                const active = priorityFilter === value
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setPriorityFilter(active ? null : value as Priority)}
                                        className={`flex items-center gap-2 text-sm py-1 text-left transition-colors ${
                                            active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span
                                            className="inline-block w-1.5 h-1.5 flex-shrink-0"
                                            style={{ background: active ? color : undefined, border: active ? undefined : `1px solid ${color}` }}
                                        />
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </aside>

            {/* CENTER: Preview canvas */}
            <section className="flex flex-col overflow-hidden" style={{ background: "#F0F0F0" }}>
                {/* Toolbar */}
                <div className={`h-10 border-b border-border flex items-center px-4 gap-4 bg-background flex-shrink-0 ${isFullscreen ? "hidden" : ""}`}>
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                        Viewport:{" "}
                        {viewport === "desktop" ? "1440px" : viewport === "tablet" ? "768px" : "390px"}
                    </span>
                    <div className="ml-auto flex items-center gap-3">
                        {(["desktop", "tablet", "mobile"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setViewport(v)}
                                className={`font-mono text-xs uppercase transition-colors ${
                                    viewport === v ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                [{v[0].toUpperCase()}] {v}
                            </button>
                        ))}
                        <span className="text-muted-foreground">|</span>
                        {(["browse", "comment"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`font-mono text-xs uppercase transition-colors ${
                                    mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                        {selectedMarkup && (
                            <>
                                <span className="text-muted-foreground">|</span>
                                <button
                                    onClick={() => setShowShare(true)}
                                    className="font-mono text-xs uppercase text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    [S] Share
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {!selectedMarkup ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="font-mono text-xs text-muted-foreground uppercase">
                            Select a page to preview
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* URL bar */}
                        <div className={`h-8 border-b border-border flex items-center justify-center bg-card flex-shrink-0 ${isFullscreen ? "hidden" : ""}`}>
                            <span className="font-mono text-xs text-muted-foreground">
                                {selectedMarkup.type === "image"
                                    ? "[ IMAGE_PREVIEW ]"
                                    : `[ ${selectedMarkup.url} ]`}
                            </span>
                        </div>

                        {/* Dot-grid canvas */}
                        <div
                            className="relative flex-1 overflow-hidden"
                            style={{
                                backgroundImage: "radial-gradient(#D0D0D0 1px, transparent 1px)",
                                backgroundSize: "20px 20px",
                            }}
                        >
                            {/* Fullscreen floating button */}
                            <button
                                onClick={handleFullscreen}
                                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                                className={`absolute bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2
                                    font-mono text-xs uppercase font-medium border transition-all shadow-md
                                    ${isFullscreen
                                        ? "bg-[#88FF66] text-black border-[#88FF66] hover:bg-[#6de050]"
                                        : "bg-background text-foreground border-foreground hover:bg-foreground hover:text-background"
                                    }`}
                            >
                                {isFullscreen
                                    ? <><Minimize className="h-3.5 w-3.5" /> Exit Fullscreen</>
                                    : <><Maximize className="h-3.5 w-3.5" /> Fullscreen</>
                                }
                            </button>

                            {/* Comment pins — filtered */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {visibleComments.map((comment, i) => (
                                    <div key={comment.id} className="pointer-events-auto">
                                        <CommentPin
                                            x={comment.x}
                                            y={comment.y}
                                            number={i + 1}
                                            author={comment.author}
                                            content={comment.content}
                                            priority={comment.priority}
                                        />
                                    </div>
                                ))}
                                {newComment && (
                                    <div className="pointer-events-auto">
                                        <CommentPin
                                            x={newComment.x}
                                            y={newComment.y}
                                            number={visibleComments.length + 1}
                                            isNew
                                            onSave={handleSaveComment}
                                            onCancel={() => setNewComment(null)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Renderer */}
                            {selectedMarkup.type === "image" ? (
                                <CanvasRenderer
                                    imageUrl={selectedMarkup.url || fallbackImage}
                                    mode={mode}
                                    onCommentClick={handleCanvasClick}
                                />
                            ) : (
                                <IframeRenderer
                                    url={`/api/proxy?url=${encodeURIComponent(selectedMarkup.url)}`}
                                    viewport={viewport}
                                    mode={mode}
                                    onCommentClick={handleCanvasClick}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className={`h-8 border-t border-border px-4 flex items-center justify-between flex-shrink-0 bg-background ${isFullscreen ? "hidden" : ""}`}>
                    <span className="font-mono text-xs text-muted-foreground">
                        <span className="text-foreground">[Click]</span> Add Comment{" "}
                        <span className="text-foreground">[B/C]</span> Mode
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                        {mode.toUpperCase()} | {viewport.toUpperCase()}
                        {(statusFilter || priorityFilter) && (
                            <span className="text-foreground ml-2">[FILTERED]</span>
                        )}
                    </span>
                </div>
            </section>

            {/* RIGHT: Comments panel */}
            {selectedMarkup && !isFullscreen && showComments ? (
                <CommentThread
                    markupId={selectedMarkup.id}
                    comments={visibleComments}
                    onClose={() => setShowComments(false)}
                    onAddComment={() => {}}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdatePriority={handleUpdatePriority}
                />
            ) : (
                !isFullscreen && selectedMarkup && !showComments ? (
                    <button
                        onClick={() => setShowComments(true)}
                        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 border border-border bg-background px-2 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                        style={{ writingMode: "vertical-rl" }}
                    >
                        [→] Comments
                    </button>
                ) : !isFullscreen && !selectedMarkup ? (
                    <aside className="border-l border-border flex items-center justify-center">
                        <p className="font-mono text-xs text-muted-foreground uppercase">No page selected</p>
                    </aside>
                ) : null
            )}

            {/* Share dialog */}
            {showShare && selectedMarkup && (
                <ShareDialog
                    markupId={selectedMarkup.id}
                    onClose={() => setShowShare(false)}
                />
            )}
        </div>
    )
}
