import { MarkupClient } from "@/app/markup/[id]/MarkupClient"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"

interface SharePageProps {
    params: {
        markupId: string
    }
}

export default async function SharePage({ params }: SharePageProps) {
    const { markupId } = await params
    const markup = db.getMarkup(markupId)
    const comments = db.getComments(markupId)

    if (!markup) {
        notFound()
    }

    return (
        <MarkupClient
            markupId={markupId}
            projectId={markup.projectId}
            initialData={markup}
            initialComments={comments}
            isGuest={true}
        />
    )
}
