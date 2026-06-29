"use client"

import { useRef, useState, useCallback, ReactNode } from "react"

interface CompareSliderProps {
    left: ReactNode   // revealed from the left edge up to the handle (e.g. LIVE)
    right: ReactNode  // base layer, full width (e.g. FIGMA)
}

/**
 * Before/after comparison slider. Both slots render full-width and stacked; a
 * draggable vertical handle clips the `left` layer so dragging reveals more of
 * `left` (toward the right) or more of `right` (toward the left).
 */
export function CompareSlider({ left, right }: CompareSliderProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)
    const [pos, setPos] = useState(50)  // 0–100, handle position as % of width

    const setFromClientX = useCallback((clientX: number) => {
        const r = containerRef.current?.getBoundingClientRect()
        if (!r || r.width === 0) return
        setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)))
    }, [])

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        dragging.current = true
    }, [])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging.current) return
        setFromClientX(e.clientX)
    }, [setFromClientX])

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        dragging.current = false
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
    }, [])

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden select-none">
            {/* Base layer (right) — full width */}
            <div className="absolute inset-0">{right}</div>

            {/* Overlay layer (left) — clipped to the handle position */}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                {left}
            </div>

            {/* Divider + drag handle */}
            <div
                className="absolute top-0 bottom-0 z-40"
                style={{ left: `${pos}%`, transform: "translateX(-50%)", width: 28, cursor: "ew-resize" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {/* vertical line */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2" style={{ width: 2, backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(0,0,0,0.25)" }} />
                {/* round grab knob */}
                <div
                    className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full"
                    style={{
                        transform: "translate(-50%, -50%)",
                        width: 32,
                        height: 32,
                        backgroundColor: "#FFFFFF",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                        color: "#050505",
                        fontSize: 12,
                        fontFamily: "monospace",
                    }}
                >
                    ‹›
                </div>
            </div>
        </div>
    )
}
