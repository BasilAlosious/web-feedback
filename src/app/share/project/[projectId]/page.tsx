import { ProjectClient } from "@/app/projects/[id]/ProjectClient"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"

interface ProjectSharePageProps {
    params: {
        projectId: string
    }
}

export default async function ProjectSharePage({ params }: ProjectSharePageProps) {
    const { projectId } = await params

    // Fetch all markups for the project (no auth required — public share link)
    const markups = await db.getMarkups(projectId)
    if (markups.length === 0) {
        notFound()
    }

    const firstMarkup = markups[0]
    const initialComments = await db.getComments(firstMarkup.id)

    // Minimal project stub (name not needed for guest view)
    const project = { id: projectId, name: "Shared Project", url: "", userId: "", markupCount: markups.length, updatedAt: "" }

    return (
        <ProjectClient
            projectId={projectId}
            project={project}
            markups={markups}
            initialSelectedMarkup={firstMarkup}
            initialComments={initialComments}
            isGuest={true}
        />
    )
}
