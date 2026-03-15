/**
 * Data layer — dual mode:
 *   • POSTGRES_URL set  → Vercel Postgres (production / Vercel dev)
 *   • POSTGRES_URL unset → local JSON file at data/db.json (local dev)
 */

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

// ─────────────────────────────────────────────────────────────────────────────
// JSON adapter (local dev, no Postgres required)
// ─────────────────────────────────────────────────────────────────────────────

function jsonDb() {
    // Dynamic require so Next.js doesn't bundle 'fs' for the edge runtime
    const fs   = require('fs')   as typeof import('fs')
    const path = require('path') as typeof import('path')

    const DB_PATH = path.join(process.cwd(), 'data', 'db.json')
    const empty   = { projects: [] as Project[], markups: [] as Markup[], comments: [] as Comment[] }

    function read() {
        if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2)); return empty }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as typeof empty
    }
    function write(data: typeof empty) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)) }

    return {
        getProjects: async (): Promise<Project[]> => read().projects,

        addProject: async (p: Project): Promise<Project> => {
            const d = read(); d.projects.unshift(p); write(d); return p
        },

        getMarkups: async (projectId: string): Promise<Markup[]> =>
            read().markups.filter(m => m.projectId === projectId),

        getMarkup: async (id: string): Promise<Markup | undefined> =>
            read().markups.find(m => m.id === id),

        addMarkup: async (m: Markup): Promise<Markup> => {
            const d = read(); d.markups.unshift(m)
            const p = d.projects.find(p => p.id === m.projectId); if (p) p.markupCount++
            write(d); return m
        },

        updateMarkup: async (id: string, patch: Partial<Markup>): Promise<Markup> => {
            const d = read(); const i = d.markups.findIndex(m => m.id === id)
            if (i === -1) throw new Error('Markup not found')
            d.markups[i] = { ...d.markups[i], ...patch }; write(d); return d.markups[i]
        },

        deleteMarkup: async (id: string): Promise<void> => {
            const d = read(); const m = d.markups.find(m => m.id === id)
            if (m) { const p = d.projects.find(p => p.id === m.projectId); if (p) p.markupCount = Math.max(0, p.markupCount - 1) }
            d.markups = d.markups.filter(m => m.id !== id)
            d.comments = d.comments.filter(c => c.markupId !== id)
            write(d)
        },

        getComments: async (markupId: string): Promise<Comment[]> =>
            read().comments.filter(c => c.markupId === markupId),

        addComment: async (c: Comment): Promise<Comment> => {
            const d = read(); d.comments.push(c)
            const m = d.markups.find(m => m.id === c.markupId); if (m) m.commentCount++
            write(d); return c
        },

        updateComment: async (id: string, patch: Partial<Comment>): Promise<Comment> => {
            const d = read(); const i = d.comments.findIndex(c => c.id === id)
            if (i === -1) throw new Error('Comment not found')
            d.comments[i] = { ...d.comments[i], ...patch }; write(d); return d.comments[i]
        },

        getCommentsForProject: async (projectId: string): Promise<Comment[]> => {
            const d = read()
            const ids = new Set(d.markups.filter(m => m.projectId === projectId).map(m => m.id))
            return d.comments.filter(c => ids.has(c.markupId))
        },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Postgres adapter (Vercel / production)
// ─────────────────────────────────────────────────────────────────────────────

function postgresDb() {
    const { sql } = require('@vercel/postgres') as typeof import('@vercel/postgres')

    const SP = `id, name, url, markup_count AS "markupCount", updated_at AS "updatedAt"`
    const SM = `id, project_id AS "projectId", name, url, viewport, comment_count AS "commentCount", type`
    const SC = `id, markup_id AS "markupId", x, y, content, author, created_at AS "createdAt", priority, status`

    return {
        getProjects: async (): Promise<Project[]> => {
            const { rows } = await sql.query(`SELECT ${SP} FROM projects ORDER BY updated_at DESC`)
            return rows as Project[]
        },

        addProject: async (p: Project): Promise<Project> => {
            await sql`INSERT INTO projects (id, name, url, markup_count, updated_at)
                      VALUES (${p.id}, ${p.name}, ${p.url}, ${p.markupCount}, ${p.updatedAt})`
            return p
        },

        getMarkups: async (projectId: string): Promise<Markup[]> => {
            const { rows } = await sql.query(`SELECT ${SM} FROM markups WHERE project_id = $1`, [projectId])
            return rows as Markup[]
        },

        getMarkup: async (id: string): Promise<Markup | undefined> => {
            const { rows } = await sql.query(`SELECT ${SM} FROM markups WHERE id = $1`, [id])
            return rows[0] as Markup | undefined
        },

        addMarkup: async (m: Markup): Promise<Markup> => {
            await sql`INSERT INTO markups (id, project_id, name, url, viewport, comment_count, type)
                      VALUES (${m.id}, ${m.projectId}, ${m.name}, ${m.url}, ${m.viewport}, ${m.commentCount}, ${m.type})`
            await sql`UPDATE projects SET markup_count = markup_count + 1 WHERE id = ${m.projectId}`
            return m
        },

        updateMarkup: async (id: string, patch: Partial<Markup>): Promise<Markup> => {
            if (patch.name     !== undefined) await sql`UPDATE markups SET name     = ${patch.name}     WHERE id = ${id}`
            if (patch.url      !== undefined) await sql`UPDATE markups SET url      = ${patch.url}      WHERE id = ${id}`
            if (patch.viewport !== undefined) await sql`UPDATE markups SET viewport = ${patch.viewport} WHERE id = ${id}`
            if (patch.type     !== undefined) await sql`UPDATE markups SET type     = ${patch.type}     WHERE id = ${id}`
            const { rows } = await sql.query(`SELECT ${SM} FROM markups WHERE id = $1`, [id])
            if (!rows[0]) throw new Error('Markup not found')
            return rows[0] as Markup
        },

        deleteMarkup: async (id: string): Promise<void> => {
            const { rows } = await sql.query(`SELECT project_id FROM markups WHERE id = $1`, [id])
            if (!rows[0]) return
            await sql`DELETE FROM markups WHERE id = ${id}`
            await sql`UPDATE projects SET markup_count = GREATEST(markup_count - 1, 0) WHERE id = ${rows[0].project_id}`
        },

        getComments: async (markupId: string): Promise<Comment[]> => {
            const { rows } = await sql.query(
                `SELECT ${SC} FROM comments WHERE markup_id = $1 ORDER BY created_at ASC`, [markupId]
            )
            return rows as Comment[]
        },

        addComment: async (c: Comment): Promise<Comment> => {
            await sql`INSERT INTO comments (id, markup_id, x, y, content, author, created_at, priority, status)
                      VALUES (${c.id}, ${c.markupId}, ${c.x}, ${c.y}, ${c.content}, ${c.author},
                              ${c.createdAt}, ${c.priority ?? null}, ${c.status ?? 'open'})`
            await sql`UPDATE markups SET comment_count = comment_count + 1 WHERE id = ${c.markupId}`
            return c
        },

        updateComment: async (id: string, patch: Partial<Comment>): Promise<Comment> => {
            if (patch.status   !== undefined) await sql`UPDATE comments SET status   = ${patch.status}           WHERE id = ${id}`
            if (patch.priority !== undefined) await sql`UPDATE comments SET priority = ${patch.priority ?? null} WHERE id = ${id}`
            const { rows } = await sql.query(`SELECT ${SC} FROM comments WHERE id = $1`, [id])
            if (!rows[0]) throw new Error('Comment not found')
            return rows[0] as Comment
        },

        getCommentsForProject: async (projectId: string): Promise<Comment[]> => {
            const { rows } = await sql.query(
                `SELECT c.id, c.markup_id AS "markupId", c.x, c.y, c.content, c.author,
                        c.created_at AS "createdAt", c.priority, c.status
                 FROM comments c
                 INNER JOIN markups m ON c.markup_id = m.id
                 WHERE m.project_id = $1
                 ORDER BY c.created_at ASC`,
                [projectId]
            )
            return rows as Comment[]
        },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export the right adapter based on environment
// ─────────────────────────────────────────────────────────────────────────────

export const db = process.env.POSTGRES_URL ? postgresDb() : jsonDb()
