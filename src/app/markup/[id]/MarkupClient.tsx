"use client"

import { useState } from "react"
import { MarkupToolbar } from "@/components/markup/MarkupToolbar"
import { IframeRenderer } from "@/components/markup/IframeRenderer"
import { CanvasRenderer } from "@/components/markup/CanvasRenderer"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Markup, Comment } from "@/lib/db"
import Link from "next/link"
import { CommentPin } from "@/components/comments/CommentPin"
import { CommentThread } from "@/components/comments/CommentThread"
import { addComment } from "@/app/actions"

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
    const [showThread, setShowThread] = useState(false)

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
            author: "Agency User", // TODO: Real user auth
            createdAt: new Date().toISOString(),
        }

        setComments([...comments, optimisticComment])
        setNewComment(null)
        setShowThread(true)

        // Server Action
        try {
            const savedComment = await addComment(markup.id, content, newComment.x, newComment.y, "Agency User")
            // Replace optimistic with real (though in this simple case they are similar, but ID might differ if server generated it differently)
            // Since our server action generates ID, we should update it.
            setComments(prev => prev.map(c => c.id === tempId ? savedComment : c))
        } catch (error) {
            console.error("Failed to save comment", error)
            setComments(prev => prev.filter(c => c.id !== tempId)) // Revert
        }
    }

    const handleAddThreadComment = (content: string) => {
        // For now, threads are just flat comments. 
        // In a real app, this would add a reply.
    }

    const handleShare = () => {
        if (!markup) return
        const shareUrl = `${window.location.origin}/share/${markup.id}`
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("Share link copied to clipboard!")
        })
    }

    const fallbackImage = "https://placehold.co/1920x1080/png?text=Website+Screenshot"

    if (!markup) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h2 className="text-xl font-semibold">Markup not found</h2>
                {!isGuest && (
                    <Button asChild>
                        <Link href={`/projects/${projectId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project
                        </Link>
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="flex h-screen relative overflow-hidden">
            <div className="flex-1 flex flex-col relative min-w-0">
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
                />

                <div className="relative flex-1 bg-muted/20 overflow-auto flex justify-center">
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

                    {showFallback || markup.type === "image" ? (
                        <CanvasRenderer
                            imageUrl={markup.url || fallbackImage}
                            mode={mode}
                            onCommentClick={handleCanvasClick}
                        />
                    ) : (
                        <>
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600 shadow-md"
                                    onClick={() => setShowFallback(true)}
                                >
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Site blocked? Switch to Screenshot Mode
                                </Button>
                            </div>
                            <div className="absolute top-4 right-4 z-50">
                                <Button
                                    variant={useProxy ? "default" : "secondary"}
                                    size="sm"
                                    onClick={() => setUseProxy(!useProxy)}
                                    className="shadow-md"
                                >
                                    {useProxy ? "Disable Proxy" : "Enable Proxy (Fix Load Issues)"}
                                </Button>
                            </div>
                            <IframeRenderer
                                url={useProxy ? `/api/proxy?url=${encodeURIComponent(markup.url)}` : markup.url}
                                viewport={viewport}
                                mode={mode}
                                onCommentClick={handleCanvasClick}
                            />
                        </>
                    )}
                </div>
            </div>

            {showThread && (
                <CommentThread
                    markupId={markupId}
                    comments={comments}
                    onClose={() => setShowThread(false)}
                    onAddComment={handleAddThreadComment}
                />
            )}
        </div>
    )
}
