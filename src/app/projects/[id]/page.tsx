import { ProjectClient } from "./ProjectClient"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"

interface ProjectPageProps {
    params: {
        id: string
    }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    const { id } = await params
    const projects = await db.getProjects(user.id)
    const project = projects.find(p => p.id === id)

    // If project not found or doesn't belong to user, show 404
    if (!project) {
        notFound()
    }

    const markups = await db.getMarkups(id)
    const firstMarkup = markups[0]
    const initialComments = firstMarkup ? await db.getComments(firstMarkup.id) : []

    return (
        <ProjectClient
            projectId={id}
            project={project}
            markups={markups}
            initialSelectedMarkup={firstMarkup}
            initialComments={initialComments}
        />
    )
}
