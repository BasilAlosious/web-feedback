"use client"

import Link from "next/link"
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog"
import { createProject } from "../actions"
import { Project } from "@/lib/db"

interface DashboardClientProps {
    initialProjects: Project[]
}

export function DashboardClient({ initialProjects }: DashboardClientProps) {
    const handleCreateProject = async (name: string, url: string) => {
        const formData = new FormData()
        formData.append("title", name)
        formData.append("url", url)
        await createProject(formData)
    }

    // Calculate progress based on markups (mock calculation)
    const getProgress = (markupCount: number) => {
        const progress = Math.min(markupCount * 10, 100)
        const filled = Math.round(progress / 10)
        const empty = 10 - filled
        return {
            percent: progress,
            bar: "#".repeat(filled) + "-".repeat(empty)
        }
    }

    // Format relative time
    const formatTime = (dateString: string) => {
        if (!dateString) return "Never"

        const date = new Date(dateString)

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "Never"
        }

        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return "Just now"
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days === 1) return "Yesterday"
        if (days < 30) return `${days}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="flex flex-col h-full">
            {/* Page Header with Large Title */}
            <div className="px-6 pt-4 pb-6">
                <h1 className="page-title-xl">
                    Projects
                    <span className="count-superscript text-muted-foreground">({initialProjects.length})</span>
                </h1>
            </div>

            {/* Project List */}
            <div className="flex-1 border-t border-border overflow-hidden flex flex-col">
                {/* Column Headers */}
                <div className="grid grid-cols-[1fr_180px_80px_100px_100px] gap-4 px-6 py-3 border-b border-border bg-background">
                    <span className="slash-label">Name</span>
                    <span className="slash-label">Build Status</span>
                    <span className="slash-label">Issues</span>
                    <span className="slash-label">Owner</span>
                    <span className="slash-label text-right">Last Active</span>
                </div>

                {/* Project Rows */}
                <div className="flex-1 overflow-y-auto">
                    {initialProjects.length > 0 ? (
                        initialProjects.map((project) => {
                            const progress = getProgress(project.markupCount)
                            return (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="grid grid-cols-[1fr_180px_80px_100px_100px] gap-4 px-6 py-3 border-b border-[var(--border-light)] items-center hover:bg-accent transition-colors group"
                                >
                                    {/* Project Name */}
                                    <span className="font-semibold text-sm truncate group-hover:text-foreground">
                                        {project.name}
                                    </span>

                                    {/* ASCII Progress Bar */}
                                    <span className="ascii-progress text-xs">
                                        [<span className="fill">{progress.bar}</span>] {progress.percent}%
                                    </span>

                                    {/* Issues Count */}
                                    <span className="font-mono text-xs">
                                        <span className="text-muted-foreground">I:</span>
                                        {String(project.markupCount).padStart(2, "0")}
                                    </span>

                                    {/* Owner (placeholder) */}
                                    <span className="font-mono text-xs text-muted-foreground">
                                        BA
                                    </span>

                                    {/* Last Active */}
                                    <span className="font-mono text-xs text-muted-foreground text-right">
                                        {formatTime(project.updatedAt)}
                                    </span>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="font-mono text-sm text-muted-foreground mb-4">
                                [ NO PROJECTS FOUND ]
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                Create your first project to start gathering feedback.
                            </p>
                            <CreateProjectDialog onCreate={handleCreateProject} />
                        </div>
                    )}
                </div>

                {/* Footer with keyboard hints */}
                {initialProjects.length > 0 && (
                    <div className="px-6 py-3 border-t border-border flex items-center gap-6 text-xs text-muted-foreground">
                        <span className="font-mono">
                            <span className="bg-muted px-1 py-0.5 text-foreground mr-1">↑↓</span>
                            Navigate
                        </span>
                        <span className="font-mono">
                            <span className="bg-muted px-1 py-0.5 text-foreground mr-1">↵</span>
                            Select
                        </span>
                        <span className="font-mono">
                            <span className="bg-muted px-1 py-0.5 text-foreground mr-1">⌘N</span>
                            New Project
                        </span>
                        <div className="ml-auto">
                            <CreateProjectDialog onCreate={handleCreateProject} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
