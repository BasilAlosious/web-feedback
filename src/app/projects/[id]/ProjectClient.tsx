"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Markup, Comment, Project } from "@/lib/db"
import { IframeRenderer, ScrollState, IframeRendererHandle, DEVICE_PRESETS, DEFAULT_DEVICE, PRESETS_BY_CATEGORY, type DeviceKey } from "@/components/markup/IframeRenderer"
import { CanvasRenderer } from "@/components/markup/CanvasRenderer"
import { CustomScrollbar } from "@/components/markup/CustomScrollbar"
import { CompareSlider } from "@/components/markup/CompareSlider"
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
    updateCommentPosition,
    updateMarkupFigmaUrl,
} from "@/app/actions"
import { FigmaViewer } from "@/components/markup/FigmaViewer"
import { ProjectHeader } from "@/components/layout/ProjectHeader"
import { useUser } from "@/lib/user-context"

interface ProjectClientProps {
    projectId: string
    project?: Project
    markups: Markup[]
    initialSelectedMarkup?: Markup
    initialComments: Comment[]
    isGuest?: boolean
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
    isGuest = false,
}: ProjectClientProps) {
    const user = useUser()
    const [markups, setMarkups] = useState<Markup[]>(initialMarkups)
    const [selectedMarkup, setSelectedMarkup] = useState<Markup | undefined>(initialSelectedMarkup)
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [device, setDevice] = useState<DeviceKey>("desktop-1440")
    const viewport = DEVICE_PRESETS[device].category  // coarse category, derived from the active preset
    const [mode, setMode] = useState<"browse" | "comment">("comment")
    const [newComment, setNewComment] = useState<{ x: number; y: number; width?: number; height?: number; scrollY?: number; scrollX?: number } | null>(null)
    const [hoveredComment, setHoveredComment] = useState<Comment | null>(null)
    const canvasRef = useRef<HTMLDivElement>(null)

    // View mode: live site / figma embed / side-by-side compare
    const [viewMode, setViewMode] = useState<'live' | 'figma' | 'compare'>('live')

    // Figma URL inline edit state
    const [editingFigmaUrl, setEditingFigmaUrl] = useState(false)
    const [figmaUrlInput, setFigmaUrlInput] = useState("")

    // Track iframe scroll (includes viewport dimensions for accurate scroll anchoring)
    const [scrollState, setScrollState] = useState({ scrollY: 0, scrollX: 0, viewportHeight: 0, viewportWidth: 0, documentHeight: 0 })
    const handleScrollChange = useCallback((scroll: ScrollState) => {
        setScrollState({
            scrollY: scroll.scrollY,
            scrollX: scroll.scrollX,
            viewportHeight: scroll.viewportHeight,
            viewportWidth: scroll.viewportWidth,
            documentHeight: scroll.documentHeight,
        })
    }, [])
    // Imperative handle to drive iframe scroll from the custom scrollbar.
    const iframeHandleRef = useRef<IframeRendererHandle>(null)

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

    // Measured width of the canvas viewport — used to scale the fixed-size device
    // frame down so it fits the available space (fit-to-width).
    const [canvasWidth, setCanvasWidth] = useState(0)

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
        setViewMode('live')
        setDevice(DEFAULT_DEVICE.desktop)
        setScrollState({ scrollY: 0, scrollX: 0, viewportHeight: 0, viewportWidth: 0, documentHeight: 0 })
        const fetched = await getComments(markup.id)
        setComments(fetched)
    }

    // ── Comment creation ────────────────────────────────────────────────────
    const handleCanvasClick = (x: number, y: number, width?: number, height?: number, scrollY?: number, scrollX?: number) => {
        if (mode === "comment") {
            setNewComment({ x, y, width, height, scrollY, scrollX })
        }
    }

    const handleSaveComment = async (content: string, priority?: Priority) => {
        if (!newComment || !selectedMarkup) return
        const tempId = Math.random().toString(36).substring(7)
        const authorName = isGuest ? "Guest" : (user?.name || "Agency User")
        const optimistic: Comment = {
            id: tempId,
            markupId: selectedMarkup.id,
            x: newComment.x,
            y: newComment.y,
            width: newComment.width,
            height: newComment.height,
            scrollY: newComment.scrollY,
            scrollX: newComment.scrollX,
            content,
            author: authorName,
            createdAt: new Date().toISOString(),
            priority,
            status: 'open',
            isGuest,
            viewport,
            device,
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
                isGuest,
                newComment.scrollY,
                newComment.scrollX,
                viewport,
                device
            )
            setComments(prev => prev.map(c => c.id === tempId ? saved : c))
        } catch {
            setComments(prev => prev.filter(c => c.id !== tempId))
        }
    }

    // ── Comment position update ─────────────────────────────────────────────
    const handleMoveComment = async (commentId: string, newX: number, newY: number) => {
        const newScrollY = scrollState.scrollY
        const newScrollX = scrollState.scrollX
        setComments(prev => prev.map(c => c.id === commentId
            ? { ...c, x: newX, y: newY, scrollY: newScrollY, scrollX: newScrollX }
            : c
        ))
        try {
            await updateCommentPosition(commentId, newX, newY, newScrollY, newScrollX)
        } catch {
            const fetched = await getComments(selectedMarkup?.id ?? "")
            setComments(fetched)
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

    // ── Filtered comments — strict per-device-preset isolation ──────────────
    const visibleComments = comments.filter(c => {
        const cDevice = c.device ?? DEFAULT_DEVICE[c.viewport ?? 'desktop']
        const deviceMatch = cDevice === device
        const statusMatch = !statusFilter || (c.status ?? 'open') === statusFilter
        const priorityMatch = !priorityFilter || c.priority === priorityFilter
        return deviceMatch && statusMatch && priorityMatch
    })

    // Track the canvas width so we can fit the fixed-size frame to the available space.
    useEffect(() => {
        const el = canvasRef.current
        if (!el) return
        const update = () => setCanvasWidth(el.clientWidth)
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [selectedMarkup?.id, viewMode, isFullscreen])

    // Fixed logical size of the active device preset, and the scale needed to fit it.
    const frameSize = { w: DEVICE_PRESETS[device].w, h: DEVICE_PRESETS[device].h }
    const fitScale = canvasWidth > 0 ? Math.min(1, canvasWidth / frameSize.w) : 1
    const effectiveScale = fitScale * (zoomLevel / 100)

    const fallbackImage = "https://placehold.co/1920x1080/png?text=Website+Screenshot"

    // Shared scroll-adjusted comment pin renderer (passed as children into the renderers)
    const renderCommentPins = () => {
        const h = scrollState.viewportHeight || canvasRef.current?.clientHeight || 1
        const w = scrollState.viewportWidth || canvasRef.current?.clientWidth || 1
        return (
            <div className="absolute inset-0 z-20 pointer-events-none">
                {visibleComments.map((comment, i) => {
                    const dy = ((scrollState.scrollY - (comment.scrollY ?? 0)) / h) * 100
                    const dx = ((scrollState.scrollX - (comment.scrollX ?? 0)) / w) * 100
                    const adjustedY = comment.y - dy
                    const adjustedX = comment.x - dx
                    if (adjustedY < -5 || adjustedY > 105) return null
                    return (
                        <div key={comment.id} className="pointer-events-auto">
                            <CommentPin
                                x={adjustedX}
                                y={adjustedY}
                                width={comment.width}
                                height={comment.height}
                                number={i + 1}
                                author={comment.author}
                                content={comment.content}
                                priority={comment.priority}
                                isHighlighted={hoveredComment?.id === comment.id}
                                onMove={(newX, newY) => handleMoveComment(comment.id, newX, newY)}
                            />
                        </div>
                    )
                })}
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
        )
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
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
                    gridTemplateRows: "minmax(0, 1fr)",
                    gridTemplateColumns: isFullscreen
                        ? "1fr"
                        : showComments && selectedMarkup && mode === "comment"
                            ? "260px 1fr 320px"
                            : "260px 1fr"
                }}
            >
            {/* LEFT: Pages panel - hidden in fullscreen */}
            {!isFullscreen && (
            <aside className="border-r border-border flex flex-col overflow-hidden bg-white min-h-0">
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
                                <div className="font-mono text-[9px] text-[#888888] mb-1">Page link</div>
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
                                    {copied ? "✓ COPIED!" : "COPY PAGE LINK"}
                                </button>
                                <div className="font-mono text-[9px] text-[#888888] mt-1">Project link (all pages)</div>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/share/project/${projectId}`
                                        navigator.clipboard.writeText(url)
                                        setCopied(true)
                                        setTimeout(() => setCopied(false), 2000)
                                    }}
                                    className="font-mono text-[11px] font-semibold px-3 py-1.5 border transition-colors w-full border-[#E0E0E0] bg-white text-[#050505] hover:bg-[#88FF66] hover:border-[#88FF66]"
                                >
                                    COPY PROJECT LINK
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="font-mono text-[10px] text-[#888888] py-1.5">
                                    Select a page to share
                                </p>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/share/project/${projectId}`
                                        navigator.clipboard.writeText(url)
                                        setCopied(true)
                                        setTimeout(() => setCopied(false), 2000)
                                    }}
                                    className="font-mono text-[11px] font-semibold px-3 py-1.5 border transition-colors w-full border-[#E0E0E0] bg-white text-[#050505] hover:bg-[#88FF66] hover:border-[#88FF66]"
                                >
                                    COPY PROJECT LINK
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Figma URL section — per selected page */}
                {!isGuest && selectedMarkup && (
                <div className="p-5 border-b border-border flex-shrink-0">
                    <div className="font-mono text-[9px] font-semibold uppercase text-[#888888] mb-3">Figma Prototype</div>
                    {editingFigmaUrl ? (
                        <div className="flex flex-col gap-2">
                            <input
                                autoFocus
                                type="url"
                                value={figmaUrlInput}
                                onChange={e => setFigmaUrlInput(e.target.value)}
                                placeholder="https://www.figma.com/proto/..."
                                className="w-full bg-transparent px-2 py-1.5 text-[10px] font-mono focus:outline-none border"
                                style={{ borderColor: "#E0E0E0", color: "#050505" }}
                                onKeyDown={async e => {
                                    if (e.key === 'Enter') {
                                        const updated = { ...selectedMarkup, figmaUrl: figmaUrlInput || undefined }
                                        setSelectedMarkup(updated)
                                        setMarkups(prev => prev.map(m => m.id === selectedMarkup.id ? updated : m))
                                        setEditingFigmaUrl(false)
                                        await updateMarkupFigmaUrl(selectedMarkup.id, figmaUrlInput || null)
                                    }
                                    if (e.key === 'Escape') { setEditingFigmaUrl(false) }
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        const updated = { ...selectedMarkup, figmaUrl: figmaUrlInput || undefined }
                                        setSelectedMarkup(updated)
                                        setMarkups(prev => prev.map(m => m.id === selectedMarkup.id ? updated : m))
                                        setEditingFigmaUrl(false)
                                        await updateMarkupFigmaUrl(selectedMarkup.id, figmaUrlInput || null)
                                    }}
                                    className="flex-1 font-mono text-[11px] px-2 py-1 bg-[#050505] text-white border border-[#050505] hover:bg-[#333]"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingFigmaUrl(false)}
                                    className="font-mono text-[11px] px-2 py-1 border border-[#E0E0E0] text-[#888888] hover:text-[#050505]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : selectedMarkup.figmaUrl ? (
                        <div className="flex flex-col gap-2">
                            <div className="font-mono text-[10px] text-[#888888] truncate bg-[#F5F5F5] px-2 py-1.5">
                                {selectedMarkup.figmaUrl}
                            </div>
                            <button
                                onClick={() => { setFigmaUrlInput(selectedMarkup.figmaUrl ?? ""); setEditingFigmaUrl(true) }}
                                className="font-mono text-[11px] px-3 py-1 border border-[#E0E0E0] text-[#050505] hover:bg-[#F5F5F5] w-full"
                            >
                                [✎] Edit Figma URL
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => { setFigmaUrlInput(""); setEditingFigmaUrl(true) }}
                            className="font-mono text-[11px] font-semibold px-3 py-1.5 border transition-colors w-full border-dashed border-[#E0E0E0] bg-white text-[#888888] hover:text-[#050505] hover:border-[#050505]"
                        >
                            + Add Figma Prototype URL
                        </button>
                    )}
                </div>
                )}

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
                                                {/* Hover actions — hidden for guests */}
                                                {!isGuest && (
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
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add page — hidden for guests */}
                    {!isGuest && <CreateMarkupDialog onCreate={handleCreateMarkup} />}

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
            <section className="flex flex-col overflow-hidden bg-white min-h-0">
                {/* Toolbar */}
                <div
                    className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" }}
                >
                    {/* Left - Viewport selector & Zoom controls */}
                    <div className="flex items-center gap-3 font-mono text-[9px]" style={{ color: "#888888" }}>
                        {/* Category tabs — each selects that category's default preset */}
                        <div className="flex items-center border" style={{ borderColor: "#E0E0E0" }}>
                            {([
                                { key: "desktop", label: "Desktop" },
                                { key: "tablet", label: "Tab" },
                                { key: "mobile", label: "Mobile" },
                            ] as { key: 'desktop' | 'tablet' | 'mobile'; label: string }[]).map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => { setDevice(DEFAULT_DEVICE[key]); setNewComment(null) }}
                                    className="px-2 py-1 transition-colors"
                                    style={{
                                        backgroundColor: viewport === key ? "#050505" : "#FFFFFF",
                                        color: viewport === key ? "#FFFFFF" : "#888888",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {/* Device-preset selector for the active category */}
                        <select
                            value={device}
                            onChange={(e) => { setDevice(e.target.value as DeviceKey); setNewComment(null) }}
                            className="border bg-white outline-none focus:border-[#050505] cursor-pointer"
                            style={{ borderColor: "#E0E0E0", color: "#050505", fontSize: "9px", padding: "2px 4px" }}
                            title="Device preset — comments are scoped to the selected preset"
                        >
                            {PRESETS_BY_CATEGORY[viewport].map((key) => (
                                <option key={key} value={key}>
                                    {DEVICE_PRESETS[key].label} ({DEVICE_PRESETS[key].w}×{DEVICE_PRESETS[key].h})
                                </option>
                            ))}
                        </select>

                        {/* Figma view mode toggle — only when Figma URL is set */}
                        {selectedMarkup?.figmaUrl && (
                            <div className="flex items-center border" style={{ borderColor: "#E0E0E0" }}>
                                {([
                                    { key: 'live', label: 'LIVE' },
                                    { key: 'figma', label: 'FIGMA' },
                                    { key: 'compare', label: 'COMPARE' },
                                ] as { key: 'live' | 'figma' | 'compare'; label: string }[]).map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setViewMode(key)}
                                        className="px-2 py-1 transition-colors"
                                        style={{
                                            backgroundColor: viewMode === key ? "#88FF66" : "#FFFFFF",
                                            color: viewMode === key ? "#050505" : "#888888",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
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
                            ref={canvasRef}
                            className={`relative flex-1 ${mode === "comment" ? "overflow-hidden" : "overflow-auto"}`}
                            style={{
                                backgroundImage: "radial-gradient(#D0D0D0 1px, transparent 1px)",
                                backgroundSize: "20px 20px",
                            }}
                        >
                            {/* Renderer — switches between live / figma / compare view modes */}
                            {viewMode === 'figma' && selectedMarkup.figmaUrl ? (
                                <div className="absolute inset-0">
                                    <FigmaViewer figmaUrl={selectedMarkup.figmaUrl} />
                                </div>
                            ) : viewMode === 'compare' && selectedMarkup.figmaUrl ? (
                                <CompareSlider
                                    left={
                                        <>
                                            {selectedMarkup.type === "image" ? (
                                                <CanvasRenderer
                                                    imageUrl={selectedMarkup.url || fallbackImage}
                                                    mode={mode}
                                                    onCommentClick={handleCanvasClick}
                                                    highlightedComment={null}
                                                >
                                                    {mode === "comment" && renderCommentPins()}
                                                </CanvasRenderer>
                                            ) : (
                                                <IframeRenderer
                                                    url={`/api/proxy?url=${encodeURIComponent(selectedMarkup.url)}`}
                                                    viewport={viewport}
                                                    mode={mode}
                                                    fit="fill"
                                                    onCommentClick={handleCanvasClick}
                                                    onScrollChange={handleScrollChange}
                                                    highlightedComment={null}
                                                >
                                                    {mode === "comment" && renderCommentPins()}
                                                </IframeRenderer>
                                            )}
                                            <div className="absolute top-2 left-2 z-30 font-mono text-[9px] px-2 py-1 bg-[#050505] text-white">LIVE</div>
                                        </>
                                    }
                                    right={
                                        <>
                                            <FigmaViewer figmaUrl={selectedMarkup.figmaUrl} />
                                            <div className="absolute top-2 right-2 z-30 font-mono text-[9px] px-2 py-1 bg-[#88FF66] text-[#050505]">FIGMA</div>
                                        </>
                                    }
                                />
                            ) : selectedMarkup.type === "image" ? (
                                /* Images: keep the simple zoom container (static, self-centering) */
                                <div
                                    className="relative origin-top-left transition-transform duration-200"
                                    style={{
                                        transform: `scale(${zoomLevel / 100})`,
                                        width: `${100 / (zoomLevel / 100)}%`,
                                        height: `${100 / (zoomLevel / 100)}%`,
                                    }}
                                >
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
                                    >
                                        {mode === "comment" && renderCommentPins()}
                                    </CanvasRenderer>
                                </div>
                            ) : (
                                /* Live website: fixed-size frame scaled to fit (keeps pins anchored) */
                                <div className="min-h-full flex justify-center">
                                    <div
                                        style={{
                                            width: `${frameSize.w * effectiveScale}px`,
                                            height: `${frameSize.h * effectiveScale}px`,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            className="relative origin-top-left transition-transform duration-200"
                                            style={{
                                                width: `${frameSize.w}px`,
                                                height: `${frameSize.h}px`,
                                                transform: `scale(${effectiveScale})`,
                                            }}
                                        >
                                            <IframeRenderer
                                                ref={iframeHandleRef}
                                                url={`/api/proxy?url=${encodeURIComponent(selectedMarkup.url)}`}
                                                viewport={viewport}
                                                mode={mode}
                                                frameWidth={frameSize.w}
                                                frameHeight={frameSize.h}
                                                onCommentClick={handleCanvasClick}
                                                onScrollChange={handleScrollChange}
                                                highlightedComment={hoveredComment ? {
                                                    x: hoveredComment.x,
                                                    y: hoveredComment.y,
                                                    width: hoveredComment.width,
                                                    height: hoveredComment.height
                                                } : null}
                                            >
                                                {mode === "comment" && renderCommentPins()}
                                            </IframeRenderer>
                                        </div>
                                    </div>
                                    {/* Custom draggable scrollbar (canvas-level, unscaled) */}
                                    <CustomScrollbar
                                        scrollY={scrollState.scrollY}
                                        viewportHeight={scrollState.viewportHeight}
                                        documentHeight={scrollState.documentHeight}
                                        onScroll={(y) => iframeHandleRef.current?.scrollTo(y)}
                                    />
                                </div>
                            )}
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

            {/* RIGHT: Comments panel - hidden in fullscreen and browse mode */}
            {!isFullscreen && mode === "comment" && (
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
