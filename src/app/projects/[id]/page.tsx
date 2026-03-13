import { ProjectClient } from "./ProjectClient"
import { db } from "@/lib/db"

interface ProjectPageProps {
    params: {
        id: string
    }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params
    const project = db.getProjects().find(p => p.id === id)
    const markups = db.getMarkups(id)
    const firstMarkup = markups[0]
    const initialComments = firstMarkup ? db.getComments(firstMarkup.id) : []

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
