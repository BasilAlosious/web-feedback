"use client"

import { cn } from "@/lib/utils"

interface IframeRendererProps {
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    mode: "browse" | "comment"
    onCommentClick?: (x: number, y: number) => void
}

export function IframeRenderer({ url, viewport, mode, onCommentClick }: IframeRendererProps) {
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onCommentClick) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const xPercent = (x / rect.width) * 100
        const yPercent = (y / rect.height) * 100
        onCommentClick(xPercent, yPercent)
    }

    // Desktop mode fills entire container
    if (viewport === "desktop") {
        return (
            <div className="absolute inset-0 bg-white">
                {/* Overlay for comment mode to capture clicks */}
                {mode === "comment" && (
                    <div
                        className="absolute inset-0 z-10 cursor-crosshair bg-transparent"
                        onClick={handleOverlayClick}
                    />
                )}
                <iframe
                    src={url}
                    className="h-full w-full bg-white"
                    title="Preview"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>
        )
    }

    // Tablet/Mobile modes show device frame
    const width = viewport === "tablet" ? "768px" : "375px"
    const height = viewport === "tablet" ? "1024px" : "667px"

    return (
        <div className="absolute inset-0 overflow-auto bg-muted/30 flex items-start justify-center p-8">
            <div
                className={cn(
                    "bg-background shadow-2xl transition-all duration-300 relative",
                    viewport === "mobile" && "rounded-3xl border-gray-800 border-[10px]",
                    viewport === "tablet" && "rounded-lg border-gray-300 border-4"
                )}
                style={{ width, height, flexShrink: 0 }}
            >
                {/* Overlay for comment mode to capture clicks */}
                {mode === "comment" && (
                    <div
                        className="absolute inset-0 z-10 cursor-crosshair bg-transparent"
                        onClick={handleOverlayClick}
                    />
                )}
                <iframe
                    src={url}
                    className="h-full w-full bg-white rounded-inherit"
                    title="Preview"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>
        </div>
    )
}
