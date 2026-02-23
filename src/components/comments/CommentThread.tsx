"use client"

import { useState } from "react"
import { Comment, store } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X, MessageSquare, Send } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CommentThreadProps {
    markupId: string
    comments: Comment[]
    onClose: () => void
    onAddComment?: (content: string) => void
}

export function CommentThread({ markupId, comments, onClose, onAddComment }: CommentThreadProps) {
    const [inputValue, setInputValue] = useState("")

    const handleSubmit = () => {
        if (!inputValue.trim()) return
        onAddComment?.(inputValue)
        setInputValue("")
    }

    return (
        <div className="flex h-full w-80 flex-col border-l bg-background shadow-xl transition-all animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="font-semibold">Comments ({comments.length})</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-6">
                    {comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                            <p>No comments yet.</p>
                            <p className="text-sm">Click anywhere on the screen to add one.</p>
                        </div>
                    ) : (
                        comments.map((comment, i) => (
                            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {i + 1}
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">{comment.author}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-sm text-foreground bg-muted/50 p-2 rounded-md">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Add a general comment..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        }}
                    />
                    <Button size="icon" onClick={handleSubmit}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
