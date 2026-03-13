"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"

interface CanvasRendererProps {
    imageUrl: string
    mode: "browse" | "comment"
    onCommentClick?: (x: number, y: number) => void
}

export function CanvasRenderer({ imageUrl, mode, onCommentClick }: CanvasRendererProps) {
    const imageRef = useRef<HTMLImageElement>(null)

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (mode !== "comment" || !imageRef.current || !onCommentClick) return

        const rect = imageRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Calculate percentage relative to image size
        const xPercent = (x / rect.width) * 100
        const yPercent = (y / rect.height) * 100

        onCommentClick(xPercent, yPercent)
    }

    return (
        <div className="absolute inset-0 overflow-auto bg-muted/20 flex items-start justify-center p-4">
            <div
                className={cn(
                    "relative bg-background shadow-lg",
                    mode === "comment" ? "cursor-crosshair" : "cursor-default"
                )}
                onClick={handleImageClick}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Markup Target"
                    className="max-w-full h-auto block select-none"
                    draggable={false}
                />

                {mode === "comment" && (
                    <div className="absolute inset-0 z-10 bg-transparent" />
                )}
            </div>
        </div>
    )
}
