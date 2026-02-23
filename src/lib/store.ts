"use client"

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

const PROJECTS_KEY = "feedback_2_0_projects"
const MARKUPS_KEY = "feedback_2_0_markups"
const COMMENTS_KEY = "feedback_2_0_comments"

// Initial mock data
const initialProjects: Project[] = [
    {
        id: "1",
        name: "Feedback 2.0 Website",
        url: "https://feedback-2-0.vercel.app",
        markupCount: 12,
        updatedAt: "2 hours ago",
    },
]

const initialMarkups: Markup[] = [
    {
        id: "1",
        projectId: "1",
        name: "Homepage - Desktop",
        url: "https://feedback-2-0.vercel.app",
        viewport: "desktop",
        commentCount: 4,
        type: "website",
    },
]

export const store = {
    getProjects: (): Project[] => {
        if (typeof window === "undefined") return initialProjects
        const stored = localStorage.getItem(PROJECTS_KEY)
        if (!stored) {
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(initialProjects))
            return initialProjects
        }
        return JSON.parse(stored)
    },

    addProject: (project: Project) => {
        const projects = store.getProjects()
        const newProjects = [project, ...projects]
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects))
        return newProjects
    },

    getMarkups: (projectId: string): Markup[] => {
        if (typeof window === "undefined") return initialMarkups.filter(m => m.projectId === projectId)
        const stored = localStorage.getItem(MARKUPS_KEY)
        let markups: Markup[] = stored ? JSON.parse(stored) : initialMarkups

        // If we have initial markups but localStorage was empty/partial, merge them carefully or just use store
        if (!stored) {
            localStorage.setItem(MARKUPS_KEY, JSON.stringify(initialMarkups))
            markups = initialMarkups
        }

        return markups.filter(m => m.projectId === projectId)
    },

    getMarkup: (markupId: string): Markup | undefined => {
        if (typeof window === "undefined") return initialMarkups.find(m => m.id === markupId)
        const stored = localStorage.getItem(MARKUPS_KEY)
        const markups: Markup[] = stored ? JSON.parse(stored) : initialMarkups
        return markups.find(m => m.id === markupId)
    },

    addMarkup: (markup: Markup) => {
        if (typeof window === "undefined") return
        const stored = localStorage.getItem(MARKUPS_KEY)
        const markups: Markup[] = stored ? JSON.parse(stored) : initialMarkups
        const newMarkups = [markup, ...markups]
        localStorage.setItem(MARKUPS_KEY, JSON.stringify(newMarkups))

        // Update project count
        const projects = store.getProjects()
        const projectIndex = projects.findIndex(p => p.id === markup.projectId)
        if (projectIndex >= 0) {
            projects[projectIndex].markupCount++
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
        }

        return newMarkups
    },

    getComments: (markupId: string): Comment[] => {
        if (typeof window === "undefined") return []
        const stored = localStorage.getItem(COMMENTS_KEY)
        const comments: Comment[] = stored ? JSON.parse(stored) : []
        return comments.filter(c => c.markupId === markupId)
    },

    addComment: (comment: Comment) => {
        if (typeof window === "undefined") return
        const stored = localStorage.getItem(COMMENTS_KEY)
        const comments: Comment[] = stored ? JSON.parse(stored) : []
        const newComments = [comment, ...comments]
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(newComments))

        // Update markup comment count
        const storedMarkups = localStorage.getItem(MARKUPS_KEY)
        let allMarkups: Markup[] = storedMarkups ? JSON.parse(storedMarkups) : initialMarkups

        const index = allMarkups.findIndex(m => m.id === comment.markupId)
        if (index >= 0) {
            allMarkups[index].commentCount++
            localStorage.setItem(MARKUPS_KEY, JSON.stringify(allMarkups))
        }

        return newComments
    }
}
