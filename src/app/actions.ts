'use server'

import { revalidatePath } from 'next/cache'
import { db, Project, Markup, Comment } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
    const title = formData.get('title') as string
    const url = formData.get('url') as string

    if (!title || !url) return { error: 'Missing fields' }

    const newProject: Project = {
        id: Math.random().toString(36).substring(7),
        name: title,
        url,
        markupCount: 0,
        updatedAt: 'Just now', // ideally use proper date formatting
    }

    db.addProject(newProject)
    revalidatePath('/')
    return { success: true }
}

export async function createMarkup(prevState: any, formData: FormData) {
    const projectId = formData.get('projectId') as string
    const type = formData.get('type') as 'website' | 'image'
    const name = formData.get('name') as string
    const url = formData.get('url') as string // For image, this will be base64 string
    const viewport = formData.get('viewport') as 'desktop' | 'tablet' | 'mobile' || 'desktop'

    if (!projectId || !name || !url) return { error: 'Missing fields' }

    const newMarkup: Markup = {
        id: Math.random().toString(36).substring(7),
        projectId,
        name,
        url,
        viewport,
        commentCount: 0,
        type,
    }

    db.addMarkup(newMarkup)
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function getComments(markupId: string): Promise<Comment[]> {
    return db.getComments(markupId)
}

export async function addComment(
    markupId: string,
    content: string,
    x: number,
    y: number,
    author: string = 'Agency User',
    priority?: 'high' | 'medium' | 'low'
) {
    const newComment: Comment = {
        id: Math.random().toString(36).substring(7),
        markupId,
        x,
        y,
        content,
        author,
        createdAt: new Date().toISOString(),
        priority,
        status: 'open',
    }

    db.addComment(newComment)
    return newComment
}

export async function renameMarkup(markupId: string, name: string) {
    return db.updateMarkup(markupId, { name })
}

export async function deleteMarkup(markupId: string) {
    const markup = db.getMarkup(markupId)
    if (!markup) throw new Error('Markup not found')
    db.deleteMarkup(markupId)
    revalidatePath(`/projects/${markup.projectId}`)
}

export async function updateCommentStatus(commentId: string, status: 'open' | 'in_progress' | 'resolved') {
    return db.updateComment(commentId, { status })
}

export async function getCommentsForProject(projectId: string) {
    return db.getCommentsForProject(projectId)
}
