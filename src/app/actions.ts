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

export async function addComment(markupId: string, content: string, x: number, y: number, author: string = 'Agency User') {
    const newComment: Comment = {
        id: Math.random().toString(36).substring(7),
        markupId,
        x,
        y,
        content,
        author,
        createdAt: new Date().toISOString(),
    }

    db.addComment(newComment)
    revalidatePath(`/projects/[id]/markup/${markupId}`, 'page') // This might need specific path logic or use tag
    return newComment
}
