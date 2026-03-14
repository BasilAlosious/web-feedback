import { db } from "@/lib/db"
import { BoardClient } from "./BoardClient"
import { notFound } from "next/navigation"

interface BoardPageProps {
    params: { id: string }
}

export default async function BoardPage({ params }: BoardPageProps) {
    const { id } = await params
    const project = db.getProjects().find(p => p.id === id)
    if (!project) notFound()

    const markups = db.getMarkups(id)
    const allComments = db.getCommentsForProject(id)

    // Build a lookup: markupId → markup name
    const markupNames: Record<string, string> = {}
    for (const m of markups) {
        markupNames[m.id] = m.name
    }

    return (
        <BoardClient
            projectId={id}
            projectName={project.name}
            markupNames={markupNames}
            initialComments={allComments}
        />
    )
}
