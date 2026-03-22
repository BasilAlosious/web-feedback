"use client"

import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface IframeRendererProps {
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    mode: "browse" | "comment"
    onCommentClick?: (x: number, y: number, width?: number, height?: number) => void
    highlightedComment?: { x: number; y: number; width?: number; height?: number } | null
}

// Minimum drag distance (in pixels) before it's considered an area selection
const MIN_DRAG_DISTANCE = 10

export function IframeRenderer({
    url,
    viewport,
    mode,
    onCommentClick,
    highlightedComment
}: IframeRendererProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
    const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)

    // Convert client coords to percentage coords
    const toPercentage = useCallback((clientX: number, clientY: number) => {
        if (!overlayRef.current) return { x: 0, y: 0 }
        const rect = overlayRef.current.getBoundingClientRect()
        return {
            x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
            y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
        }
    }, [])

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (mode !== "comment" || !onCommentClick) return
        const pos = toPercentage(e.clientX, e.clientY)
        setDragStart(pos)
        setDragCurrent(pos)
        setIsDragging(true)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !dragStart) return
        const pos = toPercentage(e.clientX, e.clientY)
        setDragCurrent(pos)
    }

    const handleMouseUp = () => {
        if (!isDragging || !dragStart || !dragCurrent || !onCommentClick) {
            setIsDragging(false)
            setDragStart(null)
            setDragCurrent(null)
            return
        }

        // Calculate selection rectangle
        const rect = overlayRef.current?.getBoundingClientRect()
        if (!rect) return

        const startPx = { x: (dragStart.x / 100) * rect.width, y: (dragStart.y / 100) * rect.height }
        const endPx = { x: (dragCurrent.x / 100) * rect.width, y: (dragCurrent.y / 100) * rect.height }
        const distance = Math.sqrt(Math.pow(endPx.x - startPx.x, 2) + Math.pow(endPx.y - startPx.y, 2))

        if (distance < MIN_DRAG_DISTANCE) {
            // Simple click - point comment
            onCommentClick(dragStart.x, dragStart.y)
        } else {
            // Drag - area comment
            const x = Math.min(dragStart.x, dragCurrent.x)
            const y = Math.min(dragStart.y, dragCurrent.y)
            const width = Math.abs(dragCurrent.x - dragStart.x)
            const height = Math.abs(dragCurrent.y - dragStart.y)
            onCommentClick(x, y, width, height)
        }

        setIsDragging(false)
        setDragStart(null)
        setDragCurrent(null)
    }

    // Calculate selection preview rectangle
    const getSelectionRect = () => {
        if (!isDragging || !dragStart || !dragCurrent) return null
        return {
            left: Math.min(dragStart.x, dragCurrent.x),
            top: Math.min(dragStart.y, dragCurrent.y),
            width: Math.abs(dragCurrent.x - dragStart.x),
            height: Math.abs(dragCurrent.y - dragStart.y),
        }
    }

    const selectionRect = getSelectionRect()

    // Render overlay with drag handlers
    const renderOverlay = () => (
        <>
            {mode === "comment" && (
                <div
                    ref={overlayRef}
                    className="absolute inset-0 z-10 cursor-crosshair bg-transparent"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        if (isDragging) {
                            setIsDragging(false)
                            setDragStart(null)
                            setDragCurrent(null)
                        }
                    }}
                />
            )}

            {/* Selection preview rectangle */}
            {selectionRect && selectionRect.width > 0 && selectionRect.height > 0 && (
                <div
                    className="absolute z-20 border-2 border-dashed pointer-events-none"
                    style={{
                        left: `${selectionRect.left}%`,
                        top: `${selectionRect.top}%`,
                        width: `${selectionRect.width}%`,
                        height: `${selectionRect.height}%`,
                        borderColor: "#88FF66",
                        backgroundColor: "rgba(136, 255, 102, 0.1)",
                    }}
                />
            )}

            {/* Hover highlight rectangle */}
            {highlightedComment && highlightedComment.width && highlightedComment.height && (
                <div
                    className="absolute z-15 border-2 pointer-events-none transition-all duration-200"
                    style={{
                        left: `${highlightedComment.x}%`,
                        top: `${highlightedComment.y}%`,
                        width: `${highlightedComment.width}%`,
                        height: `${highlightedComment.height}%`,
                        borderColor: "#FACC15",
                        backgroundColor: "rgba(250, 204, 21, 0.2)",
                    }}
                />
            )}
        </>
    )

    // Desktop mode fills entire container
    if (viewport === "desktop") {
        return (
            <div className="absolute inset-0 bg-white">
                {renderOverlay()}
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
                {renderOverlay()}
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
