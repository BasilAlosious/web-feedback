"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog"
import { createProject } from "../actions"
import { Project } from "@/lib/db"

interface DashboardClientProps {
    initialProjects: Project[]
}

export function DashboardClient({ initialProjects }: DashboardClientProps) {
    const pathname = usePathname()

    const handleCreateProject = async (name: string, url: string) => {
        const formData = new FormData()
        formData.append("title", name)
        formData.append("url", url)
        await createProject(formData)
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

        if (minutes < 1) return "just now"
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days === 1) return "1d ago"
        if (days < 30) return `${days}d ago`
        return date.toLocaleDateString()
    }

    // Check if a project is currently active (being viewed)
    const isProjectActive = (projectId: string) => {
        return pathname.includes(`/projects/${projectId}`)
    }

    // Calculate comment count (placeholder - would need to fetch from DB)
    const getCommentCount = (project: Project) => {
        return 0 // Placeholder
    }

    return (
        <div className="flex flex-col h-full bg-[#F5F5F5]">
            {/* Page Header */}
            <div className="p-12 flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="font-mono text-[24px] font-semibold" style={{ color: "#050505" }}>
                        Projects
                    </h1>
                </div>
                <CreateProjectDialog onCreate={handleCreateProject} />
            </div>

            {/* Project Cards List */}
            <div className="flex-1 px-12 pb-12 overflow-y-auto">
                {initialProjects.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {initialProjects.map((project) => {
                            const isActive = isProjectActive(project.id)
                            const commentCount = getCommentCount(project)

                            return (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className={`group flex items-center justify-between p-5 transition-all border ${
                                        isActive
                                            ? "bg-[#88FF66] border-2 border-[#88FF66]"
                                            : "bg-white border border-[#E0E0E0] hover:bg-[#F5F5F5] hover:border-[#050505]"
                                    }`}
                                >
                                    {/* Left Side - Project Info */}
                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-mono text-[14px] font-semibold text-[#050505]">
                                            {project.name}
                                        </h3>
                                        <p
                                            className={`font-mono text-[9px] ${
                                                isActive
                                                    ? "text-[#050505]"
                                                    : "text-[#888888] group-hover:text-[#050505]"
                                            }`}
                                        >
                                            {project.markupCount} pages • {commentCount} comments • Last updated {formatTime(project.updatedAt)}
                                        </p>
                                    </div>

                                    {/* Right Side - Arrow */}
                                    <div
                                        className={`font-mono text-[18px] ${
                                            isActive
                                                ? "text-[#050505]"
                                                : "text-[#888888] group-hover:text-[#050505]"
                                        }`}
                                    >
                                        →
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="font-mono text-sm mb-4" style={{ color: "#888888" }}>
                            [ NO PROJECTS FOUND ]
                        </div>
                        <p className="text-sm mb-6" style={{ color: "#888888" }}>
                            Create your first project to start gathering feedback.
                        </p>
                        <CreateProjectDialog onCreate={handleCreateProject} />
                    </div>
                )}
            </div>
        </div>
    )
}
