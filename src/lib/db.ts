import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

export interface Project {
    id: string
    name: string
    url: string
    markupCount: number
    updatedAt: string
}

export interface Markup {
    id: string
    projectId: string
    name: string
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    commentCount: number
    type: "website" | "image"
}

export interface Comment {
    id: string
    markupId: string
    x: number
    y: number
    content: string
    author: string
    createdAt: string
    priority?: 'high' | 'medium' | 'low'
    status?: 'open' | 'in_progress' | 'resolved'
}

interface DB {
    projects: Project[]
    markups: Markup[]
    comments: Comment[]
}

const initialDB: DB = {
    projects: [],
    markups: [],
    comments: []
}

function readDB(): DB {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2))
        return initialDB
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
}

function writeDB(db: DB) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export const db = {
    getProjects: () => readDB().projects,
    addProject: (project: Project) => {
        const data = readDB()
        data.projects.unshift(project)
        writeDB(data)
        return project
    },

    getMarkups: (projectId: string) => readDB().markups.filter(m => m.projectId === projectId),
    getMarkup: (markupId: string) => readDB().markups.find(m => m.id === markupId),
    addMarkup: (markup: Markup) => {
        const data = readDB()
        data.markups.unshift(markup)
        // Update project count
        const project = data.projects.find(p => p.id === markup.projectId)
        if (project) project.markupCount++
        writeDB(data)
        return markup
    },

    updateMarkup: (id: string, patch: Partial<Markup>) => {
        const data = readDB()
        const idx = data.markups.findIndex(m => m.id === id)
        if (idx === -1) throw new Error('Markup not found')
        data.markups[idx] = { ...data.markups[idx], ...patch }
        writeDB(data)
        return data.markups[idx]
    },
    deleteMarkup: (id: string) => {
        const data = readDB()
        const markup = data.markups.find(m => m.id === id)
        if (markup) {
            const project = data.projects.find(p => p.id === markup.projectId)
            if (project) project.markupCount = Math.max(0, project.markupCount - 1)
        }
        data.markups = data.markups.filter(m => m.id !== id)
        data.comments = data.comments.filter(c => c.markupId !== id)
        writeDB(data)
    },

    getCommentsForProject: (projectId: string) => {
        const data = readDB()
        const markupIds = new Set(
            data.markups.filter(m => m.projectId === projectId).map(m => m.id)
        )
        return data.comments.filter(c => markupIds.has(c.markupId))
    },

    getComments: (markupId: string) => readDB().comments.filter(c => c.markupId === markupId),
    addComment: (comment: Comment) => {
        const data = readDB()
        data.comments.push(comment)
        // Update markup count
        const markup = data.markups.find(m => m.id === comment.markupId)
        if (markup) markup.commentCount++
        writeDB(data)
        return comment
    },
    updateComment: (id: string, patch: Partial<Comment>) => {
        const data = readDB()
        const idx = data.comments.findIndex(c => c.id === id)
        if (idx === -1) throw new Error('Comment not found')
        data.comments[idx] = { ...data.comments[idx], ...patch }
        writeDB(data)
        return data.comments[idx]
    },
}
