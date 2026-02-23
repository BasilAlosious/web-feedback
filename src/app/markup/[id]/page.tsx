import { MarkupClient } from "./MarkupClient"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"

interface MarkupPageProps {
    params: {
        id: string
    }
}

export default async function MarkupPage({ params }: MarkupPageProps) {
    const { id } = await params
    const markup = db.getMarkup(id)
    const comments = db.getComments(id)

    if (!markup) {
        notFound()
    }

    return (
        <MarkupClient
            markupId={id}
            projectId={markup.projectId}
            initialData={markup}
            initialComments={comments}
        />
    )
}
