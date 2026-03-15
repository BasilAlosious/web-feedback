import { ProjectClient } from "./ProjectClient"
import { db } from "@/lib/db"

interface ProjectPageProps {
    params: {
        id: string
    }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params
    const projects = await db.getProjects()
    const project = projects.find(p => p.id === id)
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
