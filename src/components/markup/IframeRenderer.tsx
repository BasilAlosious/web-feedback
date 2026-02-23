"use client"

import { cn } from "@/lib/utils"

interface IframeRendererProps {
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    mode: "browse" | "comment"
    onCommentClick?: (x: number, y: number) => void
}

export function IframeRenderer({ url, viewport, mode, onCommentClick }: IframeRendererProps) {
    // Define widths for each viewport
    const width = {
        desktop: "100%",
        tablet: "768px",
        mobile: "375px",
    }[viewport]

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onCommentClick) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const xPercent = (x / rect.width) * 100
        const yPercent = (y / rect.height) * 100
        onCommentClick(xPercent, yPercent)
    }

    return (
        <div className="flex-1 overflow-auto bg-muted/20 flex flex-col items-center py-8">
            <div
                className={cn(
                    "bg-background shadow-2xl transition-all duration-300 relative border",
                    viewport === "mobile" && "h-[667px] rounded-3xl border-gray-800 border-[10px]",
                    viewport === "tablet" && "h-[1024px] rounded-lg border-gray-300 border-4",
                    viewport === "desktop" && "h-full w-full border-none rounded-none"
                )}
                style={{ width: viewport === "desktop" ? "100%" : width }}
            >
                {/* Overlay for comment mode to capture clicks */}
                {mode === "comment" && (
                    <div
                        className="absolute inset-0 z-50 cursor-crosshair bg-transparent"
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
        </div>
    )
}
