"use client"

import { useRef, useCallback } from "react"

interface CustomScrollbarProps {
    scrollY: number
    viewportHeight: number
    documentHeight: number
    onScroll: (scrollY: number) => void
}

/**
 * A draggable vertical scrollbar overlaid on the right edge of the preview canvas.
 * The live preview scrolls internally (via postMessage), and in comment mode the
 * click-overlay covers the iframe's native scrollbar — so this provides a visible,
 * usable scroll control. Rendered at canvas level (unscaled) so it stays full size.
 */
export function CustomScrollbar({ scrollY, viewportHeight, documentHeight, onScroll }: CustomScrollbarProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ startClientY: number; startScrollY: number } | null>(null)

    const maxScroll = Math.max(0, documentHeight - viewportHeight)
    const thumbRatio = documentHeight > 0 ? Math.min(1, viewportHeight / documentHeight) : 1

    const trackH = () => trackRef.current?.clientHeight ?? 0

    const handleThumbPointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        dragRef.current = { startClientY: e.clientY, startScrollY: scrollY }
    }, [scrollY])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current) return
        const usable = trackH() * (1 - thumbRatio)
        if (usable <= 0) return
        const deltaPx = e.clientY - dragRef.current.startClientY
        const deltaScroll = (deltaPx / usable) * maxScroll
        onScroll(Math.max(0, Math.min(maxScroll, dragRef.current.startScrollY + deltaScroll)))
    }, [maxScroll, thumbRatio, onScroll])

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        dragRef.current = null
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
    }, [])

    // Click on the track (not the thumb) → jump there.
    const handleTrackPointerDown = useCallback((e: React.PointerEvent) => {
        if (!trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const thumbPx = (e.clientY - rect.top) - (trackH() * thumbRatio) / 2
        const usable = trackH() * (1 - thumbRatio)
        if (usable <= 0) return
        const ratio = Math.max(0, Math.min(1, thumbPx / usable))
        onScroll(ratio * maxScroll)
    }, [thumbRatio, maxScroll, onScroll])

    // Nothing to scroll → no scrollbar. (After all hooks, to keep hook order stable.)
    if (documentHeight <= 0 || viewportHeight <= 0 || maxScroll <= 1) return null

    const thumbHeightPct = thumbRatio * 100
    const thumbTopPct = (scrollY / maxScroll) * (100 - thumbHeightPct)

    return (
        <div
            ref={trackRef}
            onPointerDown={handleTrackPointerDown}
            className="absolute top-0 right-0 h-full z-40"
            style={{
                width: 14,
                backgroundColor: "rgba(0,0,0,0.08)",
                borderLeft: "1px solid rgba(0,0,0,0.12)",
                cursor: "pointer",
            }}
        >
            <div
                onPointerDown={handleThumbPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{
                    width: 8,
                    top: `${thumbTopPct}%`,
                    height: `${thumbHeightPct}%`,
                    minHeight: 28,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    cursor: "grab",
                }}
            />
        </div>
    )
}
