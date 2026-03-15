import { sql } from '@vercel/postgres'

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

const SELECT_PROJECT = `id, name, url, markup_count AS "markupCount", updated_at AS "updatedAt"`
const SELECT_MARKUP  = `id, project_id AS "projectId", name, url, viewport, comment_count AS "commentCount", type`
const SELECT_COMMENT = `id, markup_id AS "markupId", x, y, content, author, created_at AS "createdAt", priority, status`

export const db = {
    getProjects: async (): Promise<Project[]> => {
        const { rows } = await sql.query(`SELECT ${SELECT_PROJECT} FROM projects ORDER BY updated_at DESC`)
        return rows as Project[]
    },

    addProject: async (project: Project): Promise<Project> => {
        await sql`INSERT INTO projects (id, name, url, markup_count, updated_at)
                  VALUES (${project.id}, ${project.name}, ${project.url}, ${project.markupCount}, ${project.updatedAt})`
        return project
    },

    getMarkups: async (projectId: string): Promise<Markup[]> => {
        const { rows } = await sql.query(`SELECT ${SELECT_MARKUP} FROM markups WHERE project_id = $1`, [projectId])
        return rows as Markup[]
    },

    getMarkup: async (markupId: string): Promise<Markup | undefined> => {
        const { rows } = await sql.query(`SELECT ${SELECT_MARKUP} FROM markups WHERE id = $1`, [markupId])
        return rows[0] as Markup | undefined
    },

    addMarkup: async (markup: Markup): Promise<Markup> => {
        await sql`INSERT INTO markups (id, project_id, name, url, viewport, comment_count, type)
                  VALUES (${markup.id}, ${markup.projectId}, ${markup.name}, ${markup.url}, ${markup.viewport}, ${markup.commentCount}, ${markup.type})`
        await sql`UPDATE projects SET markup_count = markup_count + 1 WHERE id = ${markup.projectId}`
        return markup
    },

    updateMarkup: async (id: string, patch: Partial<Markup>): Promise<Markup> => {
        if (patch.name      !== undefined) await sql`UPDATE markups SET name     = ${patch.name}     WHERE id = ${id}`
        if (patch.url       !== undefined) await sql`UPDATE markups SET url      = ${patch.url}      WHERE id = ${id}`
        if (patch.viewport  !== undefined) await sql`UPDATE markups SET viewport = ${patch.viewport} WHERE id = ${id}`
        if (patch.type      !== undefined) await sql`UPDATE markups SET type     = ${patch.type}     WHERE id = ${id}`
        const { rows } = await sql.query(`SELECT ${SELECT_MARKUP} FROM markups WHERE id = $1`, [id])
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
            `SELECT ${SELECT_COMMENT} FROM comments WHERE markup_id = $1 ORDER BY created_at ASC`,
            [markupId]
        )
        return rows as Comment[]
    },

    addComment: async (comment: Comment): Promise<Comment> => {
        await sql`INSERT INTO comments (id, markup_id, x, y, content, author, created_at, priority, status)
                  VALUES (${comment.id}, ${comment.markupId}, ${comment.x}, ${comment.y},
                          ${comment.content}, ${comment.author}, ${comment.createdAt},
                          ${comment.priority ?? null}, ${comment.status ?? 'open'})`
        await sql`UPDATE markups SET comment_count = comment_count + 1 WHERE id = ${comment.markupId}`
        return comment
    },

    updateComment: async (id: string, patch: Partial<Comment>): Promise<Comment> => {
        if (patch.status   !== undefined) await sql`UPDATE comments SET status   = ${patch.status}          WHERE id = ${id}`
        if (patch.priority !== undefined) await sql`UPDATE comments SET priority = ${patch.priority ?? null} WHERE id = ${id}`
        const { rows } = await sql.query(`SELECT ${SELECT_COMMENT} FROM comments WHERE id = $1`, [id])
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
