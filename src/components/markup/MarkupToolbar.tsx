"use client"

import Link from "next/link"
import { DEVICE_PRESETS, DEFAULT_DEVICE, PRESETS_BY_CATEGORY, type DeviceKey } from "@/components/markup/IframeRenderer"

interface MarkupToolbarProps {
    projectId: string
    projectName: string
    device: DeviceKey
    onDeviceChange: (device: DeviceKey) => void
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
    device,
    onDeviceChange,
    mode,
    onModeChange,
    onToggleThread,
    isGuest = false,
    onShare,
    commentCount = 0,
}: MarkupToolbarProps) {
    const category = DEVICE_PRESETS[device].category
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
                {/* Device — category tabs + preset selector */}
                <div className="flex items-center gap-2">
                    <span className="slash-label mr-2">Device</span>
                    {(["desktop", "tablet", "mobile"] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => onDeviceChange(DEFAULT_DEVICE[cat])}
                            className={`nav-item ${category === cat ? "text-foreground" : ""}`}
                        >
                            <span className="text-foreground">[{cat === "desktop" ? "D" : cat === "tablet" ? "T" : "M"}]</span>
                        </button>
                    ))}
                    <select
                        value={device}
                        onChange={(e) => onDeviceChange(e.target.value as DeviceKey)}
                        className="ml-1 border border-border bg-background font-mono text-[11px] outline-none cursor-pointer"
                        style={{ padding: "1px 4px" }}
                        title="Device preset — comments are scoped to the selected preset"
                    >
                        {PRESETS_BY_CATEGORY[category].map((key) => (
                            <option key={key} value={key}>
                                {DEVICE_PRESETS[key].label} ({DEVICE_PRESETS[key].w}×{DEVICE_PRESETS[key].h})
                            </option>
                        ))}
                    </select>
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
