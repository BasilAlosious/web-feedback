"use client"

import Link from "next/link"
import { Monitor, Tablet, Smartphone } from "lucide-react"

interface MarkupToolbarProps {
    projectId: string
    projectName: string
    viewport: "desktop" | "tablet" | "mobile"
    onViewportChange: (viewport: "desktop" | "tablet" | "mobile") => void
    mode: "browse" | "comment"
    onModeChange: (mode: "browse" | "comment") => void
    onToggleThread?: () => void
    isGuest?: boolean
    onShare?: () => void
    commentCount?: number
}

export function MarkupToolbar({
    projectId,
    projectName,
    viewport,
    onViewportChange,
    mode,
    onModeChange,
    onToggleThread,
    isGuest = false,
    onShare,
    commentCount = 0,
}: MarkupToolbarProps) {
    return (
        <div className="flex items-center justify-between border-b border-border bg-background px-4 h-10 flex-shrink-0">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
                {!isGuest && (
                    <Link href={`/projects/${projectId}`} className="nav-item">
                        <span className="text-foreground">[←]</span> Back
                    </Link>
                )}
                <span className="text-muted-foreground">/</span>
                <span className="font-mono text-xs uppercase text-foreground">
                    {projectName}
                </span>
            </div>

            {/* Center: Viewport & Mode Controls */}
            <div className="flex items-center gap-6">
                {/* Viewport */}
                <div className="flex items-center gap-2">
                    <span className="slash-label mr-2">Device</span>
                    <button
                        onClick={() => onViewportChange("desktop")}
                        className={`nav-item flex items-center gap-1 ${viewport === "desktop" ? "text-foreground" : ""}`}
                    >
                        <Monitor className="h-3 w-3" />
                        <span className="text-foreground">[D]</span>
                    </button>
                    <button
                        onClick={() => onViewportChange("tablet")}
                        className={`nav-item flex items-center gap-1 ${viewport === "tablet" ? "text-foreground" : ""}`}
                    >
                        <Tablet className="h-3 w-3" />
                        <span className="text-foreground">[T]</span>
                    </button>
                    <button
                        onClick={() => onViewportChange("mobile")}
                        className={`nav-item flex items-center gap-1 ${viewport === "mobile" ? "text-foreground" : ""}`}
                    >
                        <Smartphone className="h-3 w-3" />
                        <span className="text-foreground">[M]</span>
                    </button>
                </div>

                {/* Mode - Prominent toggle for guests */}
                {isGuest ? (
                    <div className="flex border border-[#E0E0E0]">
                        <button
                            onClick={() => onModeChange("comment")}
                            className={`px-4 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                                mode === "comment"
                                    ? "bg-[#88FF66] text-[#050505]"
                                    : "bg-white text-[#888888] hover:bg-[#F5F5F5]"
                            }`}
                        >
                            ✦ COMMENT
                        </button>
                        <button
                            onClick={() => onModeChange("browse")}
                            className={`px-4 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                                mode === "browse"
                                    ? "bg-[#050505] text-white"
                                    : "bg-white text-[#888888] hover:bg-[#F5F5F5]"
                            }`}
                        >
                            BROWSE
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="slash-label mr-2">Mode</span>
                        <button
                            onClick={() => onModeChange("browse")}
                            className={`nav-item ${mode === "browse" ? "text-foreground" : ""}`}
                        >
                            <span className="text-foreground">[B]</span> Browse
                        </button>
                        <button
                            onClick={() => onModeChange("comment")}
                            className={`nav-item ${mode === "comment" ? "text-foreground" : ""}`}
                        >
                            <span className="text-foreground">[C]</span> Comment
                        </button>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <button onClick={onToggleThread} className="nav-item">
                    <span className="text-foreground">[{commentCount}]</span> Comments
                </button>
                {!isGuest && (
                    <button onClick={onShare} className="nav-item">
                        <span className="text-foreground">[S]</span> Share
                    </button>
                )}
            </div>
        </div>
    )
}
