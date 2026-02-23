"use client"

import { ProjectCard } from "@/components/dashboard/ProjectCard"
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
        // No need to setProjects, Next.js revalidatePath will refresh the page prop
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
                <CreateProjectDialog onCreate={handleCreateProject} />
            </div>

            {initialProjects.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {initialProjects.map((project) => (
                        <ProjectCard key={project.id} {...project} />
                    ))}
                </div>
            ) : (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center animate-in fade-in-50">
                    <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                        <h3 className="mt-4 text-lg font-semibold">No projects created</h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground">
                            You haven't created any projects yet. Create one to start gathering feedback.
                        </p>
                        <CreateProjectDialog onCreate={handleCreateProject} />
                    </div>
                </div>
            )}
        </div>
    )
}
