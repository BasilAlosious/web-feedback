"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommentPinProps {
    x: number
    y: number
    number: number
    author?: string
    content?: string
    isNew?: boolean
    onSave?: (content: string) => void
    onCancel?: () => void
    onClick?: () => void
}

export function CommentPin({ x, y, number, author, content, isNew, onSave, onCancel, onClick }: CommentPinProps) {
    const [inputValue, setInputValue] = useState("")
    const [isOpen, setIsOpen] = useState(isNew)

    const handleSave = () => {
        if (!inputValue.trim()) return
        onSave?.(inputValue)
        setInputValue("")
        if (!isNew) setIsOpen(false)
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open && isNew) {
            onCancel?.()
        }
    }

    return (
        <div
            className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            isNew ? "bg-primary text-primary-foreground animate-bounce" : "bg-primary text-primary-foreground"
                        )}
                        onClick={onClick}
                    >
                        <span className="text-xs font-bold">{number}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start" side="right">
                    <div className="flex flex-col gap-2 p-3">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={`https://avatar.vercel.sh/${author || "user"}`} />
                                <AvatarFallback>US</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold">{author || "You"}</span>
                            <span className="text-xs text-muted-foreground ml-auto">Now</span>
                        </div>

                        {isNew ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a comment..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSave()
                                        }
                                    }}
                                />
                                <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSave}>
                                    <Send className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-foreground">{content}</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
