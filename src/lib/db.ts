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

    getComments: (markupId: string) => readDB().comments.filter(c => c.markupId === markupId),
    addComment: (comment: Comment) => {
        const data = readDB()
        data.comments.push(comment)
        // Update markup count
        const markup = data.markups.find(m => m.id === comment.markupId)
        if (markup) markup.commentCount++
        writeDB(data)
        return comment
    }
}
