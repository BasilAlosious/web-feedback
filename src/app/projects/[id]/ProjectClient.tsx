"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { ProjectHeader } from "@/components/layout/ProjectHeader"
import { useUser } from "@/lib/user-context"

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
    const user = useUser()
    const [markups, setMarkups] = useState<Markup[]>(initialMarkups)
    const [selectedMarkup, setSelectedMarkup] = useState<Markup | undefined>(initialSelectedMarkup)
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")
    const [mode, setMode] = useState<"browse" | "comment">("comment")
    const [useProxy] = useState(true)
    const [newComment, setNewComment] = useState<{ x: number; y: number; width?: number; height?: number } | null>(null)
    const [hoveredComment, setHoveredComment] = useState<Comment | null>(null)

    // Filters
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null)

    // Share dialog
    const [showShare, setShowShare] = useState(false)

    // Rename / delete state
    const [editingMarkupId, setEditingMarkupId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")
    const [deletingMarkupId, setDeletingMarkupId] = useState<string | null>(null)

    // Comments panel visibility
    const [showComments, setShowComments] = useState(true)

    // Copy link feedback
    const [copied, setCopied] = useState(false)

    // Fullscreen mode (hides sidebars and header)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Zoom level (percentage)
    const [zoomLevel, setZoomLevel] = useState(100)

    // ── Keyboard Shortcuts ──────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            // [Tab] - Switch mode between browse and comment
            if (e.key === 'Tab') {
                e.preventDefault()
                setMode(m => m === "browse" ? "comment" : "browse")
            }

            // [F] - Toggle fullscreen mode (hides panels)
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault()
                setIsFullscreen(prev => !prev)
            }

            // [Esc] - Exit fullscreen mode
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen])

    // ── Page selection ──────────────────────────────────────────────────────
    const handlePageSelect = async (markup: Markup) => {
        setSelectedMarkup(markup)
        setNewComment(null)
        setShowComments(true)
        const fetched = await getComments(markup.id)
        setComments(fetched)
    }

    // ── Comment creation ────────────────────────────────────────────────────
    const handleCanvasClick = (x: number, y: number, width?: number, height?: number) => {
        if (mode === "comment") {
            setNewComment({ x, y, width, height })
        }
    }

    const handleSaveComment = async (content: string, priority?: Priority) => {
        if (!newComment || !selectedMarkup) return
        const tempId = Math.random().toString(36).substring(7)
        const authorName = user?.name || "Agency User"
        const optimistic: Comment = {
            id: tempId,
            markupId: selectedMarkup.id,
            x: newComment.x,
            y: newComment.y,
            width: newComment.width,
            height: newComment.height,
            content,
            author: authorName,
            createdAt: new Date().toISOString(),
            priority,
            status: 'open',
            isGuest: false,
        }
        setComments(prev => [...prev, optimistic])
        setNewComment(null)
        try {
            const saved = await addComment(
                selectedMarkup.id,
                content,
                newComment.x,
                newComment.y,
                authorName,
                priority,
                newComment.width,
                newComment.height,
                false  // isGuest
            )
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
        <div className="flex flex-col h-full">
            {/* Project Context Header with Canvas/Board Navigation - hidden in fullscreen */}
            {!isFullscreen && (
                <ProjectHeader
                    projectName={project?.name || "Project"}
                    currentView="canvas"
                    projectId={projectId}
                />
            )}

            <div
                className="grid flex-1 overflow-hidden"
                style={{
                    gridTemplateColumns: isFullscreen
                        ? "1fr"
                        : showComments && selectedMarkup
                            ? "260px 1fr 320px"
                            : "260px 1fr"
                }}
            >
            {/* LEFT: Pages panel - hidden in fullscreen */}
            {!isFullscreen && (
            <aside className="border-r border-border flex flex-col overflow-hidden bg-white">
                {/* Mode Toggle */}
                <div className="p-5 border-b border-border flex-shrink-0">
                    <div className="font-mono text-[9px] font-semibold uppercase text-[#888888] mb-3">Mode</div>
                    <div className="flex border border-[#E0E0E0]">
                        <button
                            onClick={() => setMode("comment")}
                            className={`flex-1 px-3 py-2 font-mono text-[11px] text-center transition-colors ${
                                mode === "comment"
                                    ? "font-semibold bg-[#050505] text-white"
                                    : "text-[#888888] hover:bg-[#F5F5F5]"
                            }`}
                        >
                            COMMENT
                        </button>
                        <button
                            onClick={() => setMode("browse")}
                            className={`flex-1 px-3 py-2 font-mono text-[11px] text-center transition-colors ${
                                mode === "browse"
                                    ? "font-semibold bg-[#050505] text-white"
                                    : "text-[#888888] hover:bg-[#F5F5F5]"
                            }`}
                        >
                            BROWSE
                        </button>
                    </div>
                </div>

                {/* Share section */}
                <div className="p-5 border-b border-border flex-shrink-0">
                    <div className="font-mono text-[9px] font-semibold uppercase text-[#888888] mb-3">Share</div>
                    <div className="flex flex-col gap-2">
                        {selectedMarkup ? (
                            <>
                                <div className="font-mono text-[10px] text-[#888888] truncate bg-[#F5F5F5] px-2 py-1.5">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/share/${selectedMarkup.id}` : `/share/${selectedMarkup.id}`}
                                </div>
                                <button
                                    onClick={() => {
                                        const shareUrl = `${window.location.origin}/share/${selectedMarkup.id}`
                                        navigator.clipboard.writeText(shareUrl)
                                        setCopied(true)
                                        setTimeout(() => setCopied(false), 2000)
                                    }}
                                    className={`font-mono text-[11px] font-semibold px-3 py-1.5 border transition-colors w-full ${
                                        copied
                                            ? "bg-[#88FF66] border-[#88FF66] text-[#050505]"
                                            : "border-[#E0E0E0] bg-white text-[#050505] hover:bg-[#88FF66] hover:border-[#88FF66]"
                                    }`}
                                >
                                    {copied ? "✓ COPIED!" : "COPY GUEST LINK"}
                                </button>
                            </>
                        ) : (
                            <p className="font-mono text-[10px] text-[#888888] py-1.5">
                                Select a page to share
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                    {/* Pages list */}
                    <div>
                        <div className="font-mono text-[9px] font-semibold uppercase text-[#888888] mb-3">Pages</div>
                        {markups.length === 0 ? (
                            <p className="font-mono text-[11px] text-[#888888] py-2">No pages yet.</p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {markups.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`group relative flex items-center gap-2 px-3 py-2 transition-colors ${
                                            selectedMarkup?.id === m.id
                                                ? "bg-[#F5F5F5] text-[#050505] border-l-2 border-l-[#050505]"
                                                : "bg-white text-[#888888] hover:text-[#050505] hover:bg-[#F5F5F5]"
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
                                                    <span className="text-[11px] flex-shrink-0">◎</span>
                                                    <span className="font-mono text-[11px] flex-1 truncate">{m.name}</span>
                                                    {m.commentCount > 0 && (
                                                        <span className="font-mono text-[9px] flex-shrink-0 opacity-60">
                                                            {m.commentCount}
                                                        </span>
                                                    )}
                                                </button>
                                                {/* Hover actions */}
                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleRenameStart(m, e)}
                                                        className="font-mono text-[9px] hover:text-[#050505] px-0.5"
                                                        title="Rename"
                                                    >
                                                        [✎]
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeletingMarkupId(m.id); setEditingMarkupId(null) }}
                                                        className="font-mono text-[9px] hover:text-red-500 px-0.5"
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
                        <div className="font-mono text-[9px] font-semibold uppercase text-[#888888] mb-3">Filters</div>
                        <div className="flex flex-col gap-1">
                            {STATUS_OPTIONS.map(({ label, value, color }) => {
                                const active = statusFilter === value
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setStatusFilter(active ? null : value)}
                                        className={`flex items-center gap-2 font-mono text-[11px] py-1.5 px-2 text-left transition-colors ${
                                            active ? "bg-[#F5F5F5] text-[#050505]" : "text-[#888888] hover:text-[#050505]"
                                        }`}
                                    >
                                        <span
                                            className="inline-block w-2 h-2 shrink-0"
                                            style={{ background: active ? color : undefined, border: active ? undefined : `1px solid ${color}` }}
                                        />
                                        {label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Priority sub-filter */}
                        <div className="font-mono text-[9px] text-[#888888] mt-4 mb-2">Priority</div>
                        <div className="flex flex-col gap-1">
                            {PRIORITY_OPTIONS.map(({ label, value, color }) => {
                                const active = priorityFilter === value
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setPriorityFilter(active ? null : value as Priority)}
                                        className={`flex items-center gap-2 font-mono text-[11px] py-1.5 px-2 text-left transition-colors ${
                                            active ? "bg-[#F5F5F5] text-[#050505]" : "text-[#888888] hover:text-[#050505]"
                                        }`}
                                    >
                                        <span
                                            className="inline-block w-2 h-2 shrink-0"
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
            )}

            {/* CENTER: Preview canvas */}
            <section className="flex flex-col overflow-hidden bg-white">
                {/* Toolbar */}
                <div
                    className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" }}
                >
                    {/* Left - Viewport selector & Zoom controls */}
                    <div className="flex items-center gap-3 font-mono text-[9px]" style={{ color: "#888888" }}>
                        {/* Viewport selector buttons */}
                        <div className="flex items-center border" style={{ borderColor: "#E0E0E0" }}>
                            {[
                                { key: "desktop", label: "Desktop", size: "1440×900" },
                                { key: "tablet", label: "Tab", size: "768×1024" },
                                { key: "mobile", label: "Mobile", size: "390×844" },
                            ].map(({ key, label, size }) => (
                                <button
                                    key={key}
                                    onClick={() => setViewport(key as "desktop" | "tablet" | "mobile")}
                                    className="px-2 py-1 transition-colors"
                                    style={{
                                        backgroundColor: viewport === key ? "#050505" : "#FFFFFF",
                                        color: viewport === key ? "#FFFFFF" : "#888888",
                                    }}
                                    title={size}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <span style={{ color: "#888888", fontSize: "8px" }}>
                            {viewport === "desktop" ? "1440×900" : viewport === "tablet" ? "768×1024" : "390×844"}
                        </span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                            className="w-5 h-5 flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
                            style={{ color: zoomLevel <= 25 ? "#CCCCCC" : "#888888" }}
                            disabled={zoomLevel <= 25}
                        >
                            -
                        </button>
                        <span style={{ color: "#050505", fontWeight: 600, minWidth: "32px", textAlign: "center" }}>
                            {zoomLevel}%
                        </span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}
                            className="w-5 h-5 flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
                            style={{ color: zoomLevel >= 200 ? "#CCCCCC" : "#888888" }}
                            disabled={zoomLevel >= 200}
                        >
                            +
                        </button>
                        {zoomLevel !== 100 && (
                            <button
                                onClick={() => setZoomLevel(100)}
                                className="px-1.5 py-0.5 hover:bg-[#F5F5F5] transition-colors"
                                style={{ color: "#888888" }}
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Right - Mode toggle (fullscreen only) + Fullscreen button */}
                    <div className="flex items-center gap-2">
                        {/* Mode toggle - only visible in fullscreen */}
                        {isFullscreen && (
                            <div className="flex items-center border" style={{ borderColor: "#E0E0E0" }}>
                                <button
                                    onClick={() => setMode("browse")}
                                    className="px-3 py-1.5 font-mono text-[9px] transition-colors"
                                    style={{
                                        backgroundColor: mode === "browse" ? "#050505" : "#FFFFFF",
                                        color: mode === "browse" ? "#FFFFFF" : "#888888",
                                    }}
                                >
                                    BROWSE
                                </button>
                                <button
                                    onClick={() => setMode("comment")}
                                    className="px-3 py-1.5 font-mono text-[9px] transition-colors"
                                    style={{
                                        backgroundColor: mode === "comment" ? "#050505" : "#FFFFFF",
                                        color: mode === "comment" ? "#FFFFFF" : "#888888",
                                    }}
                                >
                                    COMMENT
                                </button>
                            </div>
                        )}

                        {/* Fullscreen button */}
                        <button
                            onClick={() => setIsFullscreen(prev => !prev)}
                            className="font-mono text-[9px] px-3 py-1.5 border transition-colors"
                            style={{
                                backgroundColor: isFullscreen ? "#050505" : "#F5F5F5",
                                borderColor: isFullscreen ? "#050505" : "#E0E0E0",
                                color: isFullscreen ? "#FFFFFF" : "#050505",
                            }}
                        >
                            {isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}
                        </button>
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
                        <div className="h-8 border-b border-border flex items-center justify-center bg-card flex-shrink-0">
                            <span className="font-mono text-xs text-muted-foreground">
                                {selectedMarkup.type === "image"
                                    ? "[ IMAGE_PREVIEW ]"
                                    : `[ ${selectedMarkup.url} ]`}
                            </span>
                        </div>

                        {/* Dot-grid canvas */}
                        <div
                            className="relative flex-1 overflow-auto"
                            style={{
                                backgroundImage: "radial-gradient(#D0D0D0 1px, transparent 1px)",
                                backgroundSize: "20px 20px",
                            }}
                        >
                            {/* Zoomable container */}
                            <div
                                className="relative origin-top-left transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoomLevel / 100})`,
                                    width: `${100 / (zoomLevel / 100)}%`,
                                    height: `${100 / (zoomLevel / 100)}%`,
                                }}
                            >
                            {/* Comment pins — filtered */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {visibleComments.map((comment, i) => (
                                    <div key={comment.id} className="pointer-events-auto">
                                        <CommentPin
                                            x={comment.x}
                                            y={comment.y}
                                            width={comment.width}
                                            height={comment.height}
                                            number={i + 1}
                                            author={comment.author}
                                            content={comment.content}
                                            priority={comment.priority}
                                            isHighlighted={hoveredComment?.id === comment.id}
                                        />
                                    </div>
                                ))}
                                {newComment && (
                                    <div className="pointer-events-auto">
                                        <CommentPin
                                            x={newComment.x}
                                            y={newComment.y}
                                            width={newComment.width}
                                            height={newComment.height}
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
                                    highlightedComment={hoveredComment ? {
                                        x: hoveredComment.x,
                                        y: hoveredComment.y,
                                        width: hoveredComment.width,
                                        height: hoveredComment.height
                                    } : null}
                                />
                            ) : (
                                <IframeRenderer
                                    url={`/api/proxy?url=${encodeURIComponent(selectedMarkup.url)}`}
                                    viewport={viewport}
                                    mode={mode}
                                    onCommentClick={handleCanvasClick}
                                    highlightedComment={hoveredComment ? {
                                        x: hoveredComment.x,
                                        y: hoveredComment.y,
                                        width: hoveredComment.width,
                                        height: hoveredComment.height
                                    } : null}
                                />
                            )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Bar */}
                <div
                    className="h-8 border-t flex items-center justify-between px-5 shrink-0"
                    style={{ backgroundColor: "#F5F5F5", borderColor: "#E0E0E0" }}
                >
                    {/* Left - Mode Indicator */}
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-[9px] font-bold" style={{ color: "#050505" }}>
                            [{mode === "comment" ? "COMMENT MODE" : "BROWSE MODE"}]
                        </span>
                    </div>

                    {/* Right - Keyboard Hints */}
                    <div className="flex items-center gap-4 font-mono text-[8px]" style={{ color: "#888888" }}>
                        <span>[TAB] Switch Mode</span>
                        <span>[Cmd+K] Search</span>
                        <span>[F] Fullscreen</span>
                    </div>
                </div>
            </section>

            {/* RIGHT: Comments panel - hidden in fullscreen */}
            {!isFullscreen && (
                selectedMarkup && showComments ? (
                    <CommentThread
                        markupId={selectedMarkup.id}
                        comments={visibleComments}
                        onClose={() => setShowComments(false)}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdatePriority={handleUpdatePriority}
                        onHoverComment={setHoveredComment}
                        highlightedCommentId={hoveredComment?.id}
                    />
                ) : selectedMarkup && !showComments ? (
                    <button
                        onClick={() => setShowComments(true)}
                        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 border border-border bg-background px-2 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                        style={{ writingMode: "vertical-rl" }}
                    >
                        [→] Comments
                    </button>
                ) : !selectedMarkup ? (
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
        </div>
    )
}
