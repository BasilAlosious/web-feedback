import { db } from "@/lib/db"
import { BoardClient } from "./BoardClient"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

interface BoardPageProps {
    params: { id: string }
}

export default async function BoardPage({ params }: BoardPageProps) {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    const { id } = await params
    const projects = await db.getProjects(user.id)
    const project = projects.find(p => p.id === id)
    if (!project) notFound()

    const [markups, allComments] = await Promise.all([
        db.getMarkups(id),
        db.getCommentsForProject(id),
    ])

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
