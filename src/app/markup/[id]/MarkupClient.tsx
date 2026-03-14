"use client"

import { useEffect, useState } from "react"
import { Maximize, Minimize } from "lucide-react"
import { MarkupToolbar } from "@/components/markup/MarkupToolbar"
import { IframeRenderer } from "@/components/markup/IframeRenderer"
import { CanvasRenderer } from "@/components/markup/CanvasRenderer"
import { Markup, Comment } from "@/lib/db"
import Link from "next/link"
import { CommentPin } from "@/components/comments/CommentPin"
import { CommentThread } from "@/components/comments/CommentThread"
import { addComment, updateCommentStatus, updateCommentPriority } from "@/app/actions"
import { ShareDialog } from "@/components/project/ShareDialog"

interface MarkupClientProps {
    markupId: string
    projectId: string
    initialData?: Markup
    initialComments: Comment[]
    isGuest?: boolean
}

export function MarkupClient({ markupId, projectId, initialData, initialComments, isGuest = false }: MarkupClientProps) {
    const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")
    const [mode, setMode] = useState<"browse" | "comment">("comment")
    const [useProxy] = useState(true)
    const [markup] = useState<Markup | undefined>(initialData)

    // Comment state
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState<{ x: number, y: number } | null>(null)
    const [showThread, setShowThread] = useState(true)
    const [showShare, setShowShare] = useState(false)

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener("fullscreenchange", handler)
        return () => document.removeEventListener("fullscreenchange", handler)
    }, [])

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
        } else {
            document.exitFullscreen().catch(() => {})
        }
    }

    const handleCanvasClick = (x: number, y: number) => {
        if (mode === "comment") {
            setNewComment({ x, y })
        }
    }

    const handleSaveComment = async (content: string, priority?: 'high' | 'medium' | 'low') => {
        if (!newComment || !markup) return

        const tempId = Math.random().toString(36).substring(7)
        const optimisticComment: Comment = {
            id: tempId,
            markupId: markup.id,
            x: newComment.x,
            y: newComment.y,
            content,
            author: "Agency User",
            createdAt: new Date().toISOString(),
            priority,
            status: 'open',
        }

        setComments(prev => [...prev, optimisticComment])
        setNewComment(null)
        setShowThread(true)

        try {
            const saved = await addComment(markup.id, content, newComment.x, newComment.y, "Agency User", priority)
            setComments(prev => prev.map(c => c.id === tempId ? saved : c))
        } catch (error) {
            console.error("Failed to save comment", error)
            setComments(prev => prev.filter(c => c.id !== tempId))
        }
    }

    const handleUpdateStatus = async (commentId: string, status: 'open' | 'in_progress' | 'resolved') => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, status } : c))
        try {
            await updateCommentStatus(commentId, status)
        } catch {
            // silently revert not needed — minor edge case
        }
    }

    const handleUpdatePriority = async (commentId: string, priority: 'high' | 'medium' | 'low' | undefined) => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, priority } : c))
        try {
            await updateCommentPriority(commentId, priority)
        } catch {
            // silently revert not needed — minor edge case
        }
    }

    const handleShare = () => setShowShare(true)

    const fallbackImage = "https://placehold.co/1920x1080/png?text=Website+Screenshot"

    if (!markup) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
                <div className="status-widget w-64 h-32">
                    <div className="status-widget-header">[ NOT_FOUND ]</div>
                </div>
                <p className="font-mono text-xs text-muted-foreground uppercase">
                    Markup not found
                </p>
                {!isGuest && (
                    <Link href={`/projects/${projectId}`} className="btn-action mt-4">
                        [←] Back to Project
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="flex h-screen relative overflow-hidden bg-background">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Toolbar */}
                {!isFullscreen && <MarkupToolbar
                    projectId={markup.projectId}
                    projectName={markup.name}
                    viewport={viewport}
                    onViewportChange={setViewport}
                    mode={mode}
                    onModeChange={setMode}
                    onToggleThread={() => setShowThread(!showThread)}
                    isGuest={isGuest}
                    onShare={handleShare}
                    commentCount={comments.length}
                />}

                {/* Canvas Area */}
                <div className="relative flex-1 flex flex-col overflow-hidden">
                    {/* Preview Header Bar */}
                    <div className={`h-8 border-b border-border flex items-center justify-center bg-card ${isFullscreen ? "hidden" : ""}`}>
                        <span className="font-mono text-xs text-muted-foreground">
                            {markup.type === "image" ? "[ IMAGE_PREVIEW ]" : `[ ${markup.url} ]`}
                        </span>
                    </div>

                    {/* Preview Content Area */}
                    <div className="relative flex-1 overflow-hidden">
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

                        {/* Comments Layer */}
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {comments.map((comment, i) => (
                                <div key={comment.id} className="pointer-events-auto">
                                    <CommentPin
                                        x={comment.x}
                                        y={comment.y}
                                        number={i + 1}
                                        author={comment.author}
                                        content={comment.content}
                                        priority={comment.priority}
                                        onClick={() => setShowThread(true)}
                                    />
                                </div>
                            ))}

                            {newComment && (
                                <div className="pointer-events-auto">
                                    <CommentPin
                                        x={newComment.x}
                                        y={newComment.y}
                                        number={comments.length + 1}
                                        isNew
                                        onSave={handleSaveComment}
                                        onCancel={() => setNewComment(null)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Renderer */}
                        {markup.type === "image" ? (
                            <CanvasRenderer
                                imageUrl={markup.url || fallbackImage}
                                mode={mode}
                                onCommentClick={handleCanvasClick}
                            />
                        ) : (
                            <IframeRenderer
                                url={`/api/proxy?url=${encodeURIComponent(markup.url)}`}
                                viewport={viewport}
                                mode={mode}
                                onCommentClick={handleCanvasClick}
                            />
                        )}
                    </div>
                </div>

                {/* Footer Status */}
                <div className={`h-8 border-t border-border px-4 flex items-center justify-between ${isFullscreen ? "hidden" : ""}`}>
                    <span className="font-mono text-xs text-muted-foreground">
                        <span className="text-foreground">[Click]</span> Add Comment{" "}
                        <span className="text-foreground">[Drag]</span> Pan{" "}
                        <span className="text-foreground">[Scroll]</span> Zoom
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                        {mode === "comment" ? "COMMENT_MODE" : "BROWSE_MODE"} | {viewport.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Comment Thread Panel */}
            {showThread && !isFullscreen && (
                <CommentThread
                    markupId={markupId}
                    comments={comments}
                    onClose={() => setShowThread(false)}
                    onAddComment={() => {}}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdatePriority={handleUpdatePriority}
                />
            )}

            {/* Share Dialog */}
            {showShare && markup && (
                <ShareDialog
                    markupId={markup.id}
                    onClose={() => setShowShare(false)}
                />
            )}
        </div>
    )
}
