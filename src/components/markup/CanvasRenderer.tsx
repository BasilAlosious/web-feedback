"use client"

import { useRef, useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CanvasRendererProps {
    imageUrl: string
    mode: "browse" | "comment"
    onCommentClick?: (x: number, y: number, width?: number, height?: number) => void
    highlightedComment?: { x: number; y: number; width?: number; height?: number } | null
    children?: ReactNode  // Comment pins to render inside the scrollable area
}

const MIN_DRAG_DISTANCE = 10

export function CanvasRenderer({ imageUrl, mode, onCommentClick, highlightedComment, children }: CanvasRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    // Drag selection state
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
    const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)

    const getPercentageCoords = (clientX: number, clientY: number) => {
        if (!imageRef.current) return null
        const rect = imageRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        return {
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== "comment" || !imageRef.current) return
        e.preventDefault()

        const coords = getPercentageCoords(e.clientX, e.clientY)
        if (!coords) return

        setDragStart(coords)
        setDragCurrent(coords)
        setIsDragging(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragStart || mode !== "comment") return

        const coords = getPercentageCoords(e.clientX, e.clientY)
        if (!coords) return

        setDragCurrent(coords)

        // Check if we've moved enough to consider this a drag
        if (!isDragging && imageRef.current) {
            const rect = imageRef.current.getBoundingClientRect()
            const startPixelX = (dragStart.x / 100) * rect.width
            const startPixelY = (dragStart.y / 100) * rect.height
            const currentPixelX = (coords.x / 100) * rect.width
            const currentPixelY = (coords.y / 100) * rect.height

            const distance = Math.sqrt(
                Math.pow(currentPixelX - startPixelX, 2) +
                Math.pow(currentPixelY - startPixelY, 2)
            )

            if (distance > MIN_DRAG_DISTANCE) {
                setIsDragging(true)
            }
        }
    }

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!dragStart || mode !== "comment" || !onCommentClick) {
            resetDragState()
            return
        }

        const coords = getPercentageCoords(e.clientX, e.clientY)
        if (!coords) {
            resetDragState()
            return
        }

        if (isDragging && dragCurrent) {
            // Area selection - calculate rectangle bounds
            const x = Math.min(dragStart.x, dragCurrent.x)
            const y = Math.min(dragStart.y, dragCurrent.y)
            const width = Math.abs(dragCurrent.x - dragStart.x)
            const height = Math.abs(dragCurrent.y - dragStart.y)

            onCommentClick(x, y, width, height)
        } else {
            // Point click - no width/height
            onCommentClick(dragStart.x, dragStart.y)
        }

        resetDragState()
    }

    const resetDragState = () => {
        setDragStart(null)
        setDragCurrent(null)
        setIsDragging(false)
    }

    // Calculate selection rectangle for preview
    const getSelectionRect = () => {
        if (!isDragging || !dragStart || !dragCurrent) return null
        return {
            left: Math.min(dragStart.x, dragCurrent.x),
            top: Math.min(dragStart.y, dragCurrent.y),
            width: Math.abs(dragCurrent.x - dragStart.x),
            height: Math.abs(dragCurrent.y - dragStart.y)
        }
    }

    const selectionRect = getSelectionRect()

    return (
        <div className="absolute inset-0 overflow-auto bg-muted/20 flex items-start justify-center p-4">
            <div
                ref={containerRef}
                className={cn(
                    "relative bg-background shadow-lg",
                    mode === "comment" ? "cursor-crosshair" : "cursor-default"
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={resetDragState}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Markup Target"
                    className="max-w-full h-auto block select-none"
                    draggable={false}
                />

                {/* Comment mode overlay */}
                {mode === "comment" && (
                    <div className="absolute inset-0 z-10 bg-transparent" />
                )}

                {/* Selection rectangle preview (while dragging) */}
                {selectionRect && (
                    <div
                        className="absolute pointer-events-none z-20"
                        style={{
                            left: `${selectionRect.left}%`,
                            top: `${selectionRect.top}%`,
                            width: `${selectionRect.width}%`,
                            height: `${selectionRect.height}%`,
                            border: "2px dashed #88FF66",
                            backgroundColor: "rgba(136, 255, 102, 0.1)",
                        }}
                    />
                )}

                {/* Hover highlight for sidebar comment */}
                {highlightedComment && highlightedComment.width && highlightedComment.height && (
                    <div
                        className="absolute pointer-events-none z-15"
                        style={{
                            left: `${highlightedComment.x}%`,
                            top: `${highlightedComment.y}%`,
                            width: `${highlightedComment.width}%`,
                            height: `${highlightedComment.height}%`,
                            border: "2px solid #FACC15",
                            backgroundColor: "rgba(250, 204, 21, 0.2)",
                        }}
                    />
                )}

                {/* Comment pins - rendered inside container so they scroll with image */}
                {children}
            </div>
        </div>
    )
}
