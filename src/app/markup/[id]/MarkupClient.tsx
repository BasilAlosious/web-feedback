"use client"

import { useState } from "react"
import { MarkupToolbar } from "@/components/markup/MarkupToolbar"
import { IframeRenderer } from "@/components/markup/IframeRenderer"
import { CanvasRenderer } from "@/components/markup/CanvasRenderer"
import { Markup, Comment } from "@/lib/db"
import Link from "next/link"
import { CommentPin } from "@/components/comments/CommentPin"
import { CommentThread } from "@/components/comments/CommentThread"
import { addComment } from "@/app/actions"
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
    const [showFallback, setShowFallback] = useState(false)
    const [useProxy, setUseProxy] = useState(false)
    const [markup] = useState<Markup | undefined>(initialData)

    // Comment state
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState<{ x: number, y: number } | null>(null)
    const [showThread, setShowThread] = useState(true)
    const [showShare, setShowShare] = useState(false)

    const handleCanvasClick = (x: number, y: number) => {
        if (mode === "comment") {
            setNewComment({ x, y })
        }
    }

    const handleSaveComment = async (content: string) => {
        if (!newComment || !markup) return

        // Optimistic update
        const tempId = Math.random().toString(36).substring(7)
        const optimisticComment: Comment = {
            id: tempId,
            markupId: markup.id,
            x: newComment.x,
            y: newComment.y,
            content,
            author: "Agency User",
            createdAt: new Date().toISOString(),
        }

        setComments([...comments, optimisticComment])
        setNewComment(null)
        setShowThread(true)

        // Server Action
        try {
            const savedComment = await addComment(markup.id, content, newComment.x, newComment.y, "Agency User")
            setComments(prev => prev.map(c => c.id === tempId ? savedComment : c))
        } catch (error) {
            console.error("Failed to save comment", error)
            setComments(prev => prev.filter(c => c.id !== tempId))
        }
    }

    const handleAddThreadComment = (content: string) => {
        // For now, threads are just flat comments.
    }

    const handleShare = () => {
        setShowShare(true)
    }

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
                <MarkupToolbar
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
                />

                {/* Canvas Area */}
                <div className="relative flex-1 flex flex-col overflow-hidden">
                    {/* Preview Header Bar */}
                    <div className="h-8 border-b border-border flex items-center justify-center bg-card">
                        <span className="font-mono text-xs text-muted-foreground">
                            {markup.type === "image" ? "[ IMAGE_PREVIEW ]" : `[ ${markup.url} ]`}
                        </span>
                    </div>

                    {/* Preview Content Area */}
                    <div className="relative flex-1 overflow-hidden">
                        {/* Mode Switch Buttons */}
                        {!showFallback && markup.type !== "image" && (
                            <div className="absolute top-2 left-2 z-50 flex gap-2">
                                <button
                                    onClick={() => setShowFallback(true)}
                                    className="btn-action text-xs bg-background"
                                >
                                    [!] Screenshot Mode
                                </button>
                                <button
                                    onClick={() => setUseProxy(!useProxy)}
                                    className={`btn-action text-xs ${useProxy ? "btn-action-primary" : "bg-background"}`}
                                >
                                    {useProxy ? "[✓] Proxy On" : "[P] Enable Proxy"}
                                </button>
                            </div>
                        )}

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
                        {showFallback || markup.type === "image" ? (
                            <CanvasRenderer
                                imageUrl={markup.url || fallbackImage}
                                mode={mode}
                                onCommentClick={handleCanvasClick}
                            />
                        ) : (
                            <IframeRenderer
                                url={useProxy ? `/api/proxy?url=${encodeURIComponent(markup.url)}` : markup.url}
                                viewport={viewport}
                                mode={mode}
                                onCommentClick={handleCanvasClick}
                            />
                        )}
                    </div>
                </div>

                {/* Footer Status */}
                <div className="h-8 border-t border-border px-4 flex items-center justify-between">
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
            {showThread && (
                <CommentThread
                    markupId={markupId}
                    comments={comments}
                    onClose={() => setShowThread(false)}
                    onAddComment={handleAddThreadComment}
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
