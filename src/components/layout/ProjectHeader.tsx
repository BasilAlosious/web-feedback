"use client"

import Link from "next/link"

interface ProjectHeaderProps {
    projectName: string
    currentView: "canvas" | "board"
    projectId: string
}

export function ProjectHeader({ projectName, currentView, projectId }: ProjectHeaderProps) {
    return (
        <>
            {/* Project Context Header */}
            <div
                className="flex items-center justify-between h-16 px-8"
                style={{ backgroundColor: "#F5F5F5" }}
            >
                {/* Left Side - Back button above Project Info */}
                <div className="flex flex-col gap-1">
                    <Link
                        href="/"
                        className="font-mono text-[11px] transition-colors text-[#888888] hover:text-[#050505]"
                    >
                        ← BACK TO PROJECTS
                    </Link>
                    <div className="font-mono text-[16px] font-semibold" style={{ color: "#050505" }}>
                        {projectName} — {currentView === "canvas" ? "Canvas View" : "Board View"}
                    </div>
                </div>

                {/* Right Side - Canvas/Board Toggle */}
                <div className="flex items-center gap-4">
                    <Link
                        href={`/projects/${projectId}`}
                        className="font-mono text-[11px] transition-colors"
                        style={{
                            color: currentView === "canvas" ? "#050505" : "#888888",
                            fontWeight: currentView === "canvas" ? 600 : "normal",
                        }}
                    >
                        Canvas
                    </Link>
                    <Link
                        href={`/projects/${projectId}/board`}
                        className="font-mono text-[11px] transition-colors"
                        style={{
                            color: currentView === "board" ? "#050505" : "#888888",
                            fontWeight: currentView === "board" ? 600 : "normal",
                        }}
                    >
                        Board
                    </Link>
                </div>
            </div>

            {/* Separator Line */}
            <div className="h-px" style={{ backgroundColor: "#E0E0E0" }} />
        </>
    )
}
