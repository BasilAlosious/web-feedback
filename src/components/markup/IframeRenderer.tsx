"use client"

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface ScrollState {
    scrollY: number
    scrollX: number
    documentHeight: number
    documentWidth: number
    viewportHeight: number
    viewportWidth: number
}

// Imperative handle so parents can drive the iframe's scroll (e.g. a custom scrollbar).
export interface IframeRendererHandle {
    scrollTo: (scrollY: number, scrollX?: number, smooth?: boolean) => void
}

interface IframeRendererProps {
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    mode: "browse" | "comment"
    onCommentClick?: (x: number, y: number, width?: number, height?: number, scrollY?: number, scrollX?: number) => void
    highlightedComment?: { x: number; y: number; width?: number; height?: number; scrollY?: number } | null
    children?: ReactNode  // Comment pins to render inside
    onScrollChange?: (scroll: ScrollState) => void  // Callback when iframe scrolls
    // "frame": render at a fixed logical size per viewport (stable layout, pins stay anchored).
    //          The parent is responsible for scaling/centering. This is the default.
    // "fill":  iframe fills its parent at fluid width (used by the compare split view).
    fit?: "frame" | "fill"
    // Optional overrides for the fixed frame size (e.g. an editable desktop width).
    frameWidth?: number
    frameHeight?: number
}

// Curated device presets. Each has a FIXED logical width so the responsive site
// renders identically every time — percentage-based pins stay anchored, and each
// preset is its own commenting context (comments are scoped per preset).
export const DEVICE_PRESETS = {
    'desktop-1440': { label: 'Desktop · 1440', category: 'desktop', w: 1440, h: 900 },
    'desktop-1990': { label: 'Desktop · 1990', category: 'desktop', w: 1990, h: 900 },
    'ipad':         { label: 'iPad',           category: 'tablet',  w: 768,  h: 1024 },
    'ipad-pro':     { label: 'iPad Pro',       category: 'tablet',  w: 1024, h: 1366 },
    'iphone-17':    { label: 'iPhone 17',      category: 'mobile',  w: 402,  h: 874 },
    'iphone-16':    { label: 'iPhone 16',      category: 'mobile',  w: 393,  h: 852 },
    'galaxy-s20':   { label: 'Galaxy S20',     category: 'mobile',  w: 360,  h: 800 },
} as const

export type DeviceKey = keyof typeof DEVICE_PRESETS
export type DeviceCategory = 'desktop' | 'tablet' | 'mobile'

// Default preset for each coarse category (used by category tabs and legacy comments).
export const DEFAULT_DEVICE: Record<DeviceCategory, DeviceKey> = {
    desktop: 'desktop-1440',
    tablet: 'ipad',
    mobile: 'iphone-16',
}

// Presets grouped by category, in declaration order — for the preset selector UI.
export const PRESETS_BY_CATEGORY: Record<DeviceCategory, DeviceKey[]> = {
    desktop: ['desktop-1440', 'desktop-1990'],
    tablet: ['ipad', 'ipad-pro'],
    mobile: ['iphone-17', 'iphone-16', 'galaxy-s20'],
}

// Minimum drag distance (in pixels) before it's considered an area selection
const MIN_DRAG_DISTANCE = 10

export const IframeRenderer = forwardRef<IframeRendererHandle, IframeRendererProps>(function IframeRenderer({
    url,
    viewport,
    mode,
    onCommentClick,
    highlightedComment,
    children,
    onScrollChange,
    fit = "frame",
    frameWidth,
    frameHeight
}: IframeRendererProps, ref) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
    const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)

    // Track iframe scroll position via postMessage from injected script
    const [iframeScroll, setIframeScroll] = useState<ScrollState>({
        scrollY: 0,
        scrollX: 0,
        documentHeight: 0,
        documentWidth: 0,
        viewportHeight: 0,
        viewportWidth: 0
    })

    // Listen for scroll messages from the iframe
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.data?.type === 'FEEDBACK_SCROLL') {
                const newScroll: ScrollState = {
                    scrollY: event.data.scrollY ?? 0,
                    scrollX: event.data.scrollX ?? 0,
                    documentHeight: event.data.documentHeight ?? 0,
                    documentWidth: event.data.documentWidth ?? 0,
                    viewportHeight: event.data.viewportHeight ?? 0,
                    viewportWidth: event.data.viewportWidth ?? 0
                }
                console.log('[IframeRenderer] Received scroll:', newScroll)
                setIframeScroll(newScroll)
                onScrollChange?.(newScroll)
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [onScrollChange])

    // Function to scroll iframe to specific position (for jump-to-comment)
    const scrollIframeTo = useCallback((scrollY: number, scrollX: number = 0, smooth: boolean = true) => {
        iframeRef.current?.contentWindow?.postMessage({
            type: 'FEEDBACK_SCROLL_TO',
            scrollY,
            scrollX,
            smooth
        }, '*')
    }, [])

    // Expose scroll control to parent (used by the custom scrollbar).
    useImperativeHandle(ref, () => ({
        scrollTo: (scrollY: number, scrollX: number = 0, smooth: boolean = false) => scrollIframeTo(scrollY, scrollX, smooth),
    }), [scrollIframeTo])

    // Forward wheel events from overlay to iframe
    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Prevent outer containers from scrolling — only the iframe should scroll
        e.stopPropagation()
        const hasIframe = !!iframeRef.current?.contentWindow
        if (hasIframe) {
            iframeRef.current!.contentWindow!.postMessage({
                type: 'FEEDBACK_SCROLL_BY',
                deltaY: e.deltaY,
                deltaX: e.deltaX
            }, '*')
        }
    }, [])

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
            // Simple click - point comment with scroll position
            onCommentClick(dragStart.x, dragStart.y, undefined, undefined, iframeScroll.scrollY, iframeScroll.scrollX)
        } else {
            // Drag - area comment with scroll position
            const x = Math.min(dragStart.x, dragCurrent.x)
            const y = Math.min(dragStart.y, dragCurrent.y)
            const width = Math.abs(dragCurrent.x - dragStart.x)
            const height = Math.abs(dragCurrent.y - dragStart.y)
            onCommentClick(x, y, width, height, iframeScroll.scrollY, iframeScroll.scrollX)
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
                    onWheel={handleWheel}
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

            {/* Comment pins - only in comment mode */}
            {mode === "comment" && children}
        </>
    )

    // "fill" mode: fluid width, fills the parent (used by the compare split view).
    if (fit === "fill") {
        return (
            <div className="absolute inset-0 bg-white">
                {renderOverlay()}
                <iframe
                    ref={iframeRef}
                    src={url}
                    className="h-full w-full bg-white"
                    title="Preview"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>
        )
    }

    // "frame" mode (default): render at a fixed logical size. A fixed width keeps the
    // site's responsive layout stable regardless of browser size, so percentage pins
    // stay anchored. The parent (ProjectClient) scales/centers this frame to fit.
    const w = frameWidth ?? DEVICE_PRESETS[DEFAULT_DEVICE[viewport]].w
    const h = frameHeight ?? DEVICE_PRESETS[DEFAULT_DEVICE[viewport]].h

    return (
        <div
            className={cn(
                "bg-background shadow-2xl relative",
                viewport === "mobile" && "rounded-3xl border-gray-800 border-[10px]",
                viewport === "tablet" && "rounded-lg border-gray-300 border-4"
            )}
            style={{ width: `${w}px`, height: `${h}px`, flexShrink: 0 }}
        >
            {renderOverlay()}
            <iframe
                ref={iframeRef}
                src={url}
                className="h-full w-full bg-white rounded-inherit"
                title="Preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
        </div>
    )
})
